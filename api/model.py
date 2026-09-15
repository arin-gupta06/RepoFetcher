"""
RepoLens AI — Rule-Based Architecture Classifier
Derives pattern predictions from heuristic layer/framework mappings
extracted from the training dataset. Can be swapped for real model
weights (.pkl / .pt) once the notebook exports them.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
import re

# ---------------------------------------------------------------------------
# Architecture pattern knowledge base (derived from training data)
# ---------------------------------------------------------------------------

# Framework → primary pattern hints
FRAMEWORK_PATTERNS: dict[str, list[tuple[str, float]]] = {
    "nestjs":     [("Clean Architecture / Hexagonal", 0.70), ("Modular Monolith & DDD", 0.20)],
    "express":    [("Layered Backend Architecture", 0.55), ("REST API Layered Architecture", 0.25)],
    "fastapi":    [("FastAPI Async Web Service", 0.65), ("Clean Architecture", 0.20)],
    "django":     [("MTV Layered Architecture", 0.70), ("Full-Stack MVC", 0.20)],
    "spring":     [("Spring Boot Layered", 0.55), ("Spring Boot REST API", 0.25)],
    "spring boot":  [("Spring Boot Layered", 0.55), ("Spring Boot REST API", 0.25)],
    "gin":        [("Go REST Router", 0.50), ("Go HTTP Middleware Router", 0.30)],
    "axum":       [("Tokio Async Web Framework", 0.60), ("Rust Web API", 0.25)],
    "actix":      [("Tokio Async Web Framework", 0.55), ("Rust Web API", 0.30)],
    "apollo":     [("GraphQL Server Architecture", 0.65), ("GraphQL Core", 0.25)],
    "graphql":    [("GraphQL Server Architecture", 0.60), ("GraphQL Core", 0.30)],
    "next.js":    [("Next.js JAMStack", 0.70), ("Scalable React Architecture", 0.20)],
    "react":      [("Scalable React Architecture", 0.60), ("Next.js JAMStack", 0.25)],
    "flutter":    [("Flutter Architecture Samples", 0.70)],
    "dapr":       [("Dapr Microservices", 0.70), ("Distributed Application Runtime", 0.20)],
    "typeorm":    [("TypeORM Repository Pattern", 0.65)],
    "fastify":    [("High Performance Node.js Server", 0.65)],
    "koa":        [("Minimal Node.js Web Framework", 0.65)],
}

# Detected layer combos → pattern hints
LAYER_PATTERNS: list[tuple[frozenset[str], str, float]] = [
    (frozenset({"controllers", "services", "repositories", "models", "infrastructure"}),
     "Clean Architecture / Hexagonal", 0.80),
    (frozenset({"controllers", "services", "repositories", "models"}),
     "Layered Backend Architecture", 0.75),
    (frozenset({"controllers", "services", "models"}),
     "Layered Backend Architecture", 0.70),
    (frozenset({"services", "models", "infrastructure"}),
     "General Modular Architecture", 0.60),
    (frozenset({"domain", "application", "infrastructure", "interfaces"}),
     "Clean Architecture", 0.85),
    (frozenset({"domain", "application", "infrastructure"}),
     "Onion Architecture", 0.75),
    (frozenset({"commands", "queries", "handlers"}),
     "CQRS Pattern", 0.80),
    (frozenset({"commands", "queries"}),
     "CQRS & Event Sourcing", 0.70),
    (frozenset({"events", "handlers", "subscribers"}),
     "Event-Driven Architecture", 0.75),
    (frozenset({"aggregates", "repositories", "events"}),
     "Domain-Driven Design", 0.75),
    (frozenset({"functions", "handlers"}),
     "Serverless Architecture", 0.70),
    (frozenset({"resolvers", "schema", "types"}),
     "GraphQL Server Architecture", 0.75),
    (frozenset({"microservices", "services", "api-gateway"}),
     "Microservices Architecture", 0.80),
]

# Language → pattern hints (fallback)
LANGUAGE_PATTERNS: dict[str, list[tuple[str, float]]] = {
    "typescript": [("TypeScript Clean Architecture", 0.35), ("Layered Backend Architecture", 0.30)],
    "javascript": [("Minimal Node.js Web Framework", 0.30), ("Layered Backend Architecture", 0.30)],
    "python":     [("FastAPI Async Web Service", 0.25), ("Architecture Patterns with Python", 0.25)],
    "go":         [("Go Standard Project Layout", 0.35), ("Go REST Router", 0.30)],
    "java":       [("Spring Boot Layered", 0.40), ("Microservices & DDD", 0.25)],
    "c#":         [("Modular Layered Architecture", 0.35), ("Clean Architecture", 0.30)],
    "rust":       [("Rust Web API", 0.40), ("Tokio Async Web Framework", 0.30)],
    "dart":       [("Flutter Architecture Samples", 0.60)],
    "php":        [("Micro Web Framework", 0.50)],
}

# All known architecture patterns for the response taxonomy
ALL_PATTERNS = [
    "Clean Architecture",
    "Layered Backend Architecture",
    "Design Patterns Catalog",
    "CQRS Pattern",
    "Microservices Architecture",
    "Hexagonal Architecture",
    "Serverless Architecture",
    "Clean Architecture / Hexagonal",
    "Modular Layered Architecture",
    "Modular Architecture",
    "CLI Tool Architecture",
    "FastAPI Async Web Service",
    "Micro Web Framework",
    "MTV Layered Architecture",
    "ASGI Middleware Stack",
    "Spring Boot Layered",
    "Spring Core IoC Container",
    "Spring Boot REST API",
    "Microservices & DDD",
    "Dapr Microservices",
    "Go HTTP Middleware Router",
    "Go REST Router",
    "Go High-Performance Web Framework",
    "Actor Model Web Framework",
    "Tokio Async Web Framework",
    "Minimal Node.js Web Framework",
    "High Performance Node.js Server",
    "Modular Monolith & DDD",
    "Onion Architecture",
    "Clean Node Architecture",
    "TypeORM Repository Pattern",
    "TypeScript Clean Architecture",
    "Domain-Driven Design",
    "Go Microservices Framework",
    "Distributed Application Runtime",
    "Event-Driven Architecture",
    "Event-Driven Microservices",
    "CQRS & Event Sourcing",
    "GraphQL Server Architecture",
    "GraphQL Core",
    "REST API Layered Architecture",
    "TypeScript REST API",
    "Full-Stack MVC",
    "Architecture Patterns with Python",
    "Full-Stack FastAPI Architecture",
    "Go Standard Project Layout",
    "Rust Web API",
    "Flutter Architecture Samples",
    "React Native Boilerplate",
    "Scalable React Architecture",
    "Next.js JAMStack",
    "General Modular Architecture",
]


@dataclass
class PredictionCandidate:
    pattern: str
    confidence: float
    evidence: list[str] = field(default_factory=list)


@dataclass
class PredictionResult:
    top_pattern: str
    confidence: float
    top_candidates: list[PredictionCandidate]
    rationale: str
    source_tier_hint: str


def _normalize(text: str) -> str:
    return text.lower().strip()


def _layer_overlap_score(detected: frozenset[str], target: frozenset[str]) -> float:
    """Jaccard-style overlap between detected layers and a target layer set."""
    if not target:
        return 0.0
    intersection = len(detected & target)
    union = len(detected | target)
    return intersection / union if union else 0.0


def predict_architecture(
    language: str,
    frameworks: list[str],
    layers: list[str],
    stars: int = 0,
    total_files: int = 0,
    has_arch_docs: bool = False,
    readme_snippet: str = "",
) -> PredictionResult:
    """
    Predict architecture pattern from repository metadata.
    Uses a weighted scoring approach combining framework hints,
    layer structure analysis, and language defaults.
    """
    scores: dict[str, float] = {}
    evidence_map: dict[str, list[str]] = {}

    lang_key = _normalize(language)
    detected_layers = frozenset(_normalize(l) for l in layers)
    fw_keys = [_normalize(f) for f in frameworks]

    # ── 1. Framework signals ────────────────────────────────────────────────
    for fw in fw_keys:
        # Partial match support (e.g. "spring boot" matches "spring")
        for key, hints in FRAMEWORK_PATTERNS.items():
            if key in fw or fw in key:
                for pattern, weight in hints:
                    scores[pattern] = scores.get(pattern, 0) + weight
                    evidence_map.setdefault(pattern, []).append(f"Framework: {fw}")

    # ── 2. Layer structure signals ──────────────────────────────────────────
    for target_layers, pattern, base_weight in LAYER_PATTERNS:
        overlap = _layer_overlap_score(detected_layers, target_layers)
        if overlap > 0.3:
            bonus = base_weight * overlap
            scores[pattern] = scores.get(pattern, 0) + bonus
            matched = sorted(detected_layers & target_layers)
            evidence_map.setdefault(pattern, []).append(
                f"Layers matched: {', '.join(matched)} ({overlap:.0%} overlap)"
            )

    # ── 3. README keyword signals ───────────────────────────────────────────
    readme_lower = _normalize(readme_snippet)
    readme_keywords: list[tuple[str, str, float]] = [
        ("cqrs", "CQRS Pattern", 0.4),
        ("event sourcing", "CQRS & Event Sourcing", 0.4),
        ("event-driven", "Event-Driven Architecture", 0.3),
        ("microservice", "Microservices Architecture", 0.35),
        ("hexagonal", "Hexagonal Architecture", 0.45),
        ("clean architecture", "Clean Architecture", 0.50),
        ("domain-driven", "Domain-Driven Design", 0.40),
        ("ddd", "Domain-Driven Design", 0.30),
        ("serverless", "Serverless Architecture", 0.40),
        ("graphql", "GraphQL Server Architecture", 0.35),
        ("onion architecture", "Onion Architecture", 0.45),
        ("layered", "Layered Backend Architecture", 0.25),
        ("mvc", "Full-Stack MVC", 0.30),
    ]
    for keyword, pattern, weight in readme_keywords:
        if keyword in readme_lower:
            scores[pattern] = scores.get(pattern, 0) + weight
            evidence_map.setdefault(pattern, []).append(f"README mentions '{keyword}'")

    # ── 4. Language fallback ────────────────────────────────────────────────
    if lang_key in LANGUAGE_PATTERNS:
        for pattern, weight in LANGUAGE_PATTERNS[lang_key]:
            # Only apply language hint if no strong signals yet
            current = scores.get(pattern, 0)
            scores[pattern] = current + weight * 0.5  # dampened fallback

    # ── 5. Size / quality signals ───────────────────────────────────────────
    if total_files > 150:
        for p in ["Clean Architecture", "Microservices Architecture", "Domain-Driven Design"]:
            scores[p] = scores.get(p, 0) + 0.10
    if has_arch_docs:
        for p in scores:
            scores[p] *= 1.05  # slight boost when architecture is documented

    # ── 6. Normalise & rank ─────────────────────────────────────────────────
    if not scores:
        # Absolute fallback
        top = "General Modular Architecture"
        return PredictionResult(
            top_pattern=top,
            confidence=0.30,
            top_candidates=[PredictionCandidate(top, 0.30, ["Insufficient metadata for strong inference"])],
            rationale=f"Based on {language} language conventions with no specific frameworks or layers detected.",
            source_tier_hint="tier_3_verified_oss",
        )

    total = sum(scores.values())
    normalised = {p: v / total for p, v in scores.items()}
    ranked = sorted(normalised.items(), key=lambda x: x[1], reverse=True)

    top_pattern, top_conf = ranked[0]

    # Build top-3 candidates
    candidates = [
        PredictionCandidate(
            pattern=p,
            confidence=round(c, 3),
            evidence=evidence_map.get(p, []),
        )
        for p, c in ranked[:3]
    ]

    # Generate rationale
    fw_str = ", ".join(frameworks) if frameworks else "none"
    layer_str = ", ".join(layers) if layers else "none"
    rationale = (
        f"Based on {language} codebase with framework(s) [{fw_str}] and "
        f"architectural layers [{layer_str}], the repository most closely matches "
        f"**{top_pattern}** ({top_conf * 100:.1f}% confidence). "
    )
    if has_arch_docs:
        rationale += "Architecture documentation was detected, strengthening this classification."

    # Source tier hint (heuristic)
    if stars > 10000:
        tier = "tier_2_official"
    elif stars > 1000:
        tier = "tier_3_verified_oss"
    else:
        tier = "tier_3_verified_oss"

    return PredictionResult(
        top_pattern=top_pattern,
        confidence=round(top_conf, 3),
        top_candidates=candidates,
        rationale=rationale,
        source_tier_hint=tier,
    )
