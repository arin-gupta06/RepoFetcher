import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import sys
from pathlib import Path
from collections import Counter
import numpy as np

sys.path.insert(0, str(Path(r"d:\RepoFetcher\api").resolve()))
import model
model._init_models()

dense_matrix = model._REPO_EMBEDDINGS_DENSE
if dense_matrix is None:
    raise RuntimeError("Model dense embeddings not loaded.")

test_cases = [
    ("FastAPI Microservices", "Python", ["FastAPI"], ["handlers", "services", "models", "infrastructure"], "Distributed microservices architecture with FastAPI and async messaging"),
    ("NestJS Clean Arch", "TypeScript", ["NestJS"], ["controllers", "services", "repositories", "domain", "ports", "adapters"], "Clean Architecture and Domain-Driven Design in NestJS with hexagonal ports"),
    ("Go Event CQRS", "Go", ["Gin"], ["commands", "queries", "aggregates", "events"], "CQRS and Event Sourcing engine implemented in Golang with event store"),
    ("Django Web App", "Python", ["Django"], ["views", "models", "templates", "urls"], "Full-stack web application powered by Django framework"),
]

for title, lang, fws, layers, readme in test_cases:
    txt = model.build_rich_text(
        language=lang,
        frameworks=fws,
        layers=layers,
        repo_name=f"test/{title.lower().replace(' ', '-')}",
        readme_snippet=readme,
        has_arch_docs=False,
    )
    vec = model.extract_dense_embedding(txt)
    if vec is None:
        continue
    sims = dense_matrix.dot(vec)
    top_idx = np.argsort(sims)[::-1][:10]
    
    print(f"\n==================== {title} ====================")
    for i in top_idx[:5]:
        m = model._REPO_METADATA[i]
        print(f"   sim={sims[i]:.3f} | {m.get('full_name')} -> {m.get('architecture_pattern')}")
