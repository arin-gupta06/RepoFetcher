"""
RepoLens AI — DistilBERT Transformer Semantic Training & Dense Embedding Pipeline
Trains sequence classification on pruned architecture data, extracts dense 768-dim
embeddings for benchmark similarity search, and exports model artifacts for live API inference.
"""

import json
import os
import shutil
import sys
import time
from pathlib import Path

# Fix Windows OpenMP duplicate library and console encoding
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer, AutoModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "model_ready" / "cleaned_repository_samples.jsonl"
DIAGRAMS_PATH = BASE_DIR / "data" / "diagrams.jsonl"
MODELS_DIR = BASE_DIR / "models"
BASE_MODEL_DIR = MODELS_DIR / "distilbert_base"
DISTILBERT_DIR = MODELS_DIR / "distilbert"
DENSE_EMBEDDINGS_PATH = MODELS_DIR / "repo_embeddings_dense.npy"
REPO_METADATA_PATH = MODELS_DIR / "repo_metadata.json"
METADATA_PATH = MODELS_DIR / "model_metadata.json"

MAX_LENGTH = 128
BATCH_SIZE = 64
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class TextOnlyDataset(Dataset):
    def __init__(self, texts: list[str], tokenizer, max_length: int = MAX_LENGTH):
        self.texts = texts
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, index):
        text = str(self.texts[index])
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )
        return {key: val.squeeze(0) for key, val in encoding.items()}


class ArchitectureClassifierHead(nn.Module):
    """
    Two-layer MLP classifier head operating on top of 768-dim DistilBERT dense embeddings.
    """
    def __init__(self, in_features: int = 768, hidden_dim: int = 256, num_classes: int = 40):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.25),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, x):
        return self.net(x)


def build_canonical_text(sample: dict) -> str:
    lang = (sample.get("language") or "unknown").lower().replace(" ", "_")
    tier = (sample.get("sourceTier") or "tier_3").lower()
    fws = " ".join([f"framework_{f.lower().replace(' ', '_')}" for f in sample.get("detectedFrameworks", [])])
    layers = " ".join([f"layer_{l.get('layerName', '').lower()}" for l in sample.get("detectedLayers", [])])
    name = (sample.get("fullName") or sample.get("name") or "").replace("/", " ")
    readme = (sample.get("cleanedReadme") or "")[:800]
    return f"language_{lang} sourcetier_{tier} {fws} {layers} {name} {readme}".strip()


def train_and_export():
    print("=" * 65)
    print("🚀 RepoLens AI — DistilBERT Semantic Training & Dense Embedding Pipeline")
    print(f"   Device:       {DEVICE}")
    print(f"   Base Model:   {BASE_MODEL_DIR}")
    print(f"   Dataset:      {DATA_PATH}")
    print("=" * 65 + "\n")

    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at {DATA_PATH}")

    if not BASE_MODEL_DIR.exists():
        raise FileNotFoundError(f"Base model directory not found at {BASE_MODEL_DIR}")

    # 1. Load Cleaned Dataset
    print("📖 Loading cleaned and pruned dataset...")
    samples = []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))

    print(f"Loaded {len(samples)} valid repository records.")

    # Check diagrams to mark has_diagram
    diagram_repo_ids = set()
    if DIAGRAMS_PATH.exists():
        with open(DIAGRAMS_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    try:
                        d = json.loads(line)
                        rid = d.get("repositoryId")
                        if rid is not None:
                            diagram_repo_ids.add(rid)
                    except Exception:
                        pass

    # 2. Extract Labels & Canonical Texts
    classes = sorted(list(set(s.get("architecturePattern", "General Modular Architecture") for s in samples)))
    class_to_id = {c: i for i, c in enumerate(classes)}
    id_to_class = {i: c for i, c in enumerate(classes)}
    num_classes = len(classes)
    print(f"Identified {num_classes} unique architecture classes.")

    texts = [build_canonical_text(s) for s in samples]
    labels = np.array([class_to_id[s.get("architecturePattern", "General Modular Architecture")] for s in samples], dtype=np.int64)

    # 3. Initialize Tokenizer & Model from Local Base
    print(f"\n🤗 Loading DistilBERT backbone and tokenizer from {BASE_MODEL_DIR}...")
    tokenizer = AutoTokenizer.from_pretrained(str(BASE_MODEL_DIR))
    transformer = AutoModel.from_pretrained(str(BASE_MODEL_DIR)).to(DEVICE)
    transformer.eval()

    # 4. Extract Normalized 768-Dim Dense Semantic Embeddings
    print("\n⚡ Extracting 768-dimensional dense semantic embeddings for all repositories...")
    dataset = TextOnlyDataset(texts, tokenizer, max_length=MAX_LENGTH)
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False)

    embeddings_list = []
    t0 = time.time()
    total_batches = len(loader)

    with torch.no_grad():
        for batch_idx, batch in enumerate(loader):
            input_ids = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)

            outputs = transformer(input_ids=input_ids, attention_mask=attention_mask)
            token_embeddings = outputs[0]  # [B, L, 768]

            # Mean-pooling with attention mask
            input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
            sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
            mean_pooled = sum_embeddings / sum_mask

            # L2-normalize
            norms = torch.norm(mean_pooled, p=2, dim=1, keepdim=True)
            normalized = (mean_pooled / norms).cpu().numpy()
            embeddings_list.append(normalized)

            if (batch_idx + 1) % 10 == 0 or (batch_idx + 1) == total_batches:
                elapsed = time.time() - t0
                pct = int((batch_idx + 1) / total_batches * 100)
                print(f"   Batches: {batch_idx + 1}/{total_batches} ({pct}%) in {elapsed:.1f}s")

    dense_embeddings_matrix = np.vstack(embeddings_list).astype(np.float32)
    print(f"Generated dense embeddings matrix: {dense_embeddings_matrix.shape}")

    # 5. Train Architecture Classifier Head
    print(f"\n🏋️ Training Architecture Classifier Head ({num_classes} classes)...")
    classifier_head = ArchitectureClassifierHead(
        in_features=768,
        hidden_dim=256,
        num_classes=num_classes,
    ).to(DEVICE)

    train_x = torch.tensor(dense_embeddings_matrix, dtype=torch.float32)
    train_y = torch.tensor(labels, dtype=torch.long)

    train_data = torch.utils.data.TensorDataset(train_x, train_y)
    train_loader = DataLoader(train_data, batch_size=64, shuffle=True)

    optimizer = torch.optim.AdamW(classifier_head.parameters(), lr=1e-3, weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss()

    classifier_head.train()
    epochs = 25
    final_acc = 0.0
    for epoch in range(1, epochs + 1):
        total_loss = 0.0
        correct = 0
        total = 0
        for bx, by in train_loader:
            bx = bx.to(DEVICE)
            by = by.to(DEVICE)
            optimizer.zero_grad()
            logits = classifier_head(bx)
            loss = criterion(logits, by)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(by)
            preds = logits.argmax(dim=-1)
            correct += (preds == by).sum().item()
            total += len(by)

        acc = (correct / total) * 100
        final_acc = acc
        if epoch % 5 == 0 or epoch == epochs:
            print(f"   Epoch {epoch:2d}/{epochs} — Loss: {total_loss / total:.4f} | Training Accuracy: {acc:.2f}%")

    # 6. Export Model Artifacts to models/distilbert/
    print(f"\n💾 Exporting model artifacts to {DISTILBERT_DIR}...")
    DISTILBERT_DIR.mkdir(parents=True, exist_ok=True)

    # Copy base transformer files and tokenizer to distilbert dir for standalone serving
    for fn in ["config.json", "model.safetensors", "tokenizer.json", "tokenizer_config.json", "vocab.txt"]:
        src = BASE_MODEL_DIR / fn
        dst = DISTILBERT_DIR / fn
        if src.exists() and not dst.exists():
            shutil.copy2(src, dst)
            print(f"   Copied {fn} -> {DISTILBERT_DIR}")

    # Save classifier head weights
    torch.save(classifier_head.state_dict(), DISTILBERT_DIR / "classifier_head.pt")
    print(f"   Saved classifier head weights -> {DISTILBERT_DIR / 'classifier_head.pt'}")

    # Save classification config with class mapping
    config = {
        "model_name": "distilbert-base-uncased",
        "num_classes": num_classes,
        "classes": classes,
        "class_to_id": class_to_id,
        "id_to_class": id_to_class,
        "max_length": MAX_LENGTH,
        "embedding_dim": 768,
    }
    with open(DISTILBERT_DIR / "architecture_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    # Save dense semantic embeddings
    np.save(DENSE_EMBEDDINGS_PATH, dense_embeddings_matrix)
    print(f"   Saved dense embeddings -> {DENSE_EMBEDDINGS_PATH} ({dense_embeddings_matrix.shape})")

    # Generate synchronized repo_metadata.json (exact 1-to-1 row alignment)
    repo_metadata_list = []
    for s in samples:
        rid = s.get("id")
        fname = s.get("fullName") or f"{s.get('owner', {}).get('login', 'unknown')}/{s.get('name', 'repo')}"
        meta = {
            "id": rid,
            "name": s.get("name") or fname.split("/")[-1],
            "full_name": fname,
            "language": s.get("language") or "Unknown",
            "architecture_pattern": s.get("architecturePattern") or "General Modular Architecture",
            "architecture": s.get("architecturePattern") or "General Modular Architecture",
            "frameworks": [f.get("framework") if isinstance(f, dict) else str(f) for f in s.get("detectedFrameworks", [])],
            "stars": s.get("stars", 0),
            "reliability_score": s.get("reliabilityScore", 0.85),
            "source_tier": s.get("sourceTier", "tier_3_verified_oss"),
            "has_diagram": rid in diagram_repo_ids,
            "cleaned_readme": (s.get("cleanedReadme") or "")[:400],
        }
        repo_metadata_list.append(meta)

    with open(REPO_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(repo_metadata_list, f, indent=2)
    print(f"   Saved synchronized repo metadata -> {REPO_METADATA_PATH} ({len(repo_metadata_list)} items)")

    # Save updated model_metadata.json
    model_metadata = {
        "model_type": "DistilBERT Sequence Classifier + 768-dim Dense Transformer Embeddings",
        "backbone": "distilbert-base-uncased",
        "num_classes": num_classes,
        "classes": classes,
        "num_samples": len(samples),
        "embedding_dim": 768,
        "semantic_engine": "DistilBERT (Mean-Pooled L2-Normalized Cosine Similarity)",
        "accuracy": round(final_acc, 2),
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
    print(f"   Saved model metadata -> {METADATA_PATH}")

    print("\n" + "=" * 65)
    print("✅ DISTILBERT ACTIVATION & SERIALIZATION COMPLETE!")
    print(f"   Model directory: {DISTILBERT_DIR}")
    print(f"   Dense Vectors:   {DENSE_EMBEDDINGS_PATH} ({dense_embeddings_matrix.shape})")
    print(f"   Synchronized:    {len(repo_metadata_list)} records")
    print(f"   Final Accuracy:  {final_acc:.2f}%")
    print("=" * 65)


if __name__ == "__main__":
    train_and_export()
