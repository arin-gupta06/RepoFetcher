import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import json
from typing import Any
import numpy as np
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel

p = r"models\distilbert"
tok: Any = AutoTokenizer.from_pretrained(p, local_files_only=True)
if tok is None:
    raise RuntimeError(f"Failed to load tokenizer from {p}")
mod: Any = AutoModel.from_pretrained(p, local_files_only=True)
mod.eval()

with open(r"models\distilbert\architecture_config.json") as f:
    cfg = json.load(f)

class Head(nn.Module):
    def __init__(self, in_features=768, hidden_dim=256, num_classes=40):
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

head = Head(num_classes=cfg["num_classes"])
head.load_state_dict(torch.load(r"models\distilbert\classifier_head.pt", map_location="cpu"))
head.eval()

inputs = [
    "language_python framework_django layer_views layer_models Full-Stack MVC web application powered by Django framework",
    "language_python framework_fastapi layer_handlers layer_services Distributed microservices architecture with FastAPI and asynchronous messaging",
    "language_go framework_gin layer_commands layer_queries CQRS and Event Sourcing engine implemented in Golang with event store",
    "language_typescript framework_nestjs layer_controllers layer_services Clean Architecture and Domain-Driven Design in NestJS"
]

dense_mat = np.load(r"models\repo_embeddings_dense.npy")

for txt in inputs:
    enc = tok(txt, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        out = mod(**enc)
        tok_emb = out[0]
        mask = enc["attention_mask"].unsqueeze(-1).expand(tok_emb.size()).float()
        pooled = torch.sum(tok_emb * mask, 1) / torch.clamp(mask.sum(1), min=1e-9)
        norm = torch.norm(pooled, p=2, dim=1, keepdim=True)
        dense_vec = (pooled / norm)
        logits = head(dense_vec)
        probs = torch.softmax(logits, dim=-1).numpy()[0]
    
    # Also check nearest neighbor cosine similarities
    sims = dense_mat.dot(dense_vec.numpy()[0])
    top_sim_idx = np.argsort(sims)[::-1][:5]

    print("\n--- Input:", txt[:55], "---")
    print("Top Head Predictions:")
    top_indices = np.argsort(probs)[::-1][:3]
    for idx in top_indices:
        print(f"   {cfg['classes'][idx]}: {probs[idx]:.4f}")
    
    print("Top 3 Nearest Neighbors in Dataset (Dense Cosine Similarity):")
    for i in top_sim_idx[:3]:
        print(f"   sim={sims[i]:.3f}")
