"""
RepoLens AI — Idea Analyzer
Matches a free-text project idea description against the training dataset repos
and returns the top similar repositories with a match percentage.
"""

from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Data path
# ---------------------------------------------------------------------------

REPO_SAMPLES_PATH = (
    Path(__file__).parent.parent / "data" / "model_ready" / "cleaned_repository_samples.jsonl"
)

# ---------------------------------------------------------------------------
# Signal keyword maps
# ---------------------------------------------------------------------------

# Maps lowercase keywords found in user text → signals we track
LANGUAGE_KEYWORDS: dict[str, str] = {
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "python": "Python",
    "py": "Python",
    "golang": "Go",
    " go ": "Go",
    "rust": "Rust",
    "java": "Java",
    "kotlin": "Java",
    "c#": "C#",
    "csharp": "C#",
    ".net": "C#",
    "dart": "Dart",
    "flutter": "Dart",
    "php": "PHP",
}

FRAMEWORK_KEYWORDS: dict[str, str] = {
    "nestjs": "NestJS",
    "nest.js": "NestJS",
    "nest ": "NestJS",
    "express": "Express",
    "expressjs": "Express",
    "express.js": "Express",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "django": "Django",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "gin": "Gin",
    "axum": "Axum",
    "actix": "Actix",
    "graphql": "GraphQL",
    "apollo": "Apollo",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "react": "React",
    "flutter": "Flutter",
    "dapr": "Dapr",
    "typeorm": "TypeORM",
    "fastify": "Fastify",
    "koa": "Koa",
    "prisma": "Prisma",
    "mongoose": "Mongoose",
}

PATTERN_KEYWORDS: dict[str, str] = {
    "clean architecture": "Clean Architecture",
    "clean arch": "Clean Architecture",
    "hexagonal": "Hexagonal Architecture",
    "ports and adapters": "Hexagonal Architecture",
    "microservice": "Microservices Architecture",
    "microservices": "Microservices Architecture",
    "cqrs": "CQRS Pattern",
    "event sourcing": "CQRS & Event Sourcing",
    "event-driven": "Event-Driven Architecture",
    "event driven": "Event-Driven Architecture",
    "ddd": "Domain-Driven Design",
    "domain-driven": "Domain-Driven Design",
    "domain driven": "Domain-Driven Design",
    "serverless": "Serverless Architecture",
    "lambda": "Serverless Architecture",
    "layered": "Layered Backend Architecture",
    "mvc": "Full-Stack MVC",
    "model view controller": "Full-Stack MVC",
    "graphql server": "GraphQL Server Architecture",
    "monolith": "Modular Monolith & DDD",
    "modular monolith": "Modular Monolith & DDD",
    "repository pattern": "Layered Backend Architecture",
}

CONCEPT_KEYWORDS: dict[str, set[str]] = {
    "auth": {"authentication", "auth", "jwt", "oauth", "login", "signup", "user management"},
    "api": {"api", "rest", "restful", "endpoint", "http", "web service"},
    "database": {"database", "db", "sql", "postgres", "postgresql", "mysql", "mongodb", "sqlite", "orm"},
    "cli": {"cli", "command line", "terminal", "command-line", "tool"},
    "realtime": {"realtime", "real-time", "websocket", "socket.io", "live"},
    "task": {"task", "todo", "tasks", "manage", "management", "project"},
    "ecommerce": {"ecommerce", "e-commerce", "shop", "store", "cart", "checkout", "payment"},
    "blog": {"blog", "cms", "content", "article", "post"},
    "chat": {"chat", "messaging", "message", "conversation"},
    "file": {"file", "upload", "storage", "s3", "blob"},
}

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class RepoSignals:
    """Extracted signals from a repo record."""
    full_name: str
    language: str
    frameworks: list[str]
    architecture_pattern: str
    stars: int
    total_files: int
    source_tier: str
    readme_snippet: str

    @property
    def github_url(self) -> str:
        return f"https://github.com/{self.full_name}"


@dataclass
class IdeaSignals:
    """Extracted signals from user's idea text."""
    raw_text: str
    languages: list[str] = field(default_factory=list)
    frameworks: list[str] = field(default_factory=list)
    patterns: list[str] = field(default_factory=list)
    concepts: list[str] = field(default_factory=list)


@dataclass
class RepoMatch:
    """A matching repository with score and explanation."""
    repo_name: str
    github_url: str
    language: str
    stars: int
    architecture_pattern: str
    detected_signals: list[str]
    match_pct: int
    rationale: str
    source_tier: str


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------

def _load_repos() -> list[RepoSignals]:
    """Load all repo samples from JSONL. Returns empty list if file missing."""
    if not REPO_SAMPLES_PATH.exists():
        return []

    repos: list[RepoSignals] = []
    with open(REPO_SAMPLES_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                repos.append(
                    RepoSignals(
                        full_name=obj.get("fullName", "unknown/repo"),
                        language=obj.get("language", ""),
                        frameworks=[fw for fw in obj.get("detectedFrameworks", [])],
                        architecture_pattern=obj.get("architecturePattern", ""),
                        stars=obj.get("stars", 0),
                        total_files=obj.get("totalFiles", 0),
                        source_tier=obj.get("sourceTier", ""),
                        readme_snippet=(obj.get("cleanedReadme") or "")[:500],
                    )
                )
            except (json.JSONDecodeError, KeyError):
                continue
    return repos


def _extract_signals(idea_text: str) -> IdeaSignals:
    """Extract language/framework/pattern/concept signals from free text."""
    text_lower = f" {idea_text.lower()} "
    signals = IdeaSignals(raw_text=idea_text)

    for kw, lang in LANGUAGE_KEYWORDS.items():
        if kw in text_lower and lang not in signals.languages:
            signals.languages.append(lang)

    for kw, fw in FRAMEWORK_KEYWORDS.items():
        if kw in text_lower and fw not in signals.frameworks:
            signals.frameworks.append(fw)

    for kw, pat in PATTERN_KEYWORDS.items():
        if kw in text_lower and pat not in signals.patterns:
            signals.patterns.append(pat)

    for concept, synonyms in CONCEPT_KEYWORDS.items():
        if any(syn in text_lower for syn in synonyms):
            signals.concepts.append(concept)

    return signals


def _score_repo(repo: RepoSignals, signals: IdeaSignals) -> tuple[int, list[str], str]:
    """
    Score a repo against extracted idea signals.
    Returns (match_pct 0-100, matched_signal_labels, rationale_string).
    """
    score = 0.0
    max_score = 0.0
    matched: list[str] = []
    reasons: list[str] = []

    # --- Language match (weight 25) ---
    max_score += 25
    if signals.languages:
        if repo.language in signals.languages:
            score += 25
            matched.append(repo.language)
            reasons.append(f"language match ({repo.language})")
        else:
            # Partial: any language detected at all
            score += 5

    # --- Framework match (weight 35) ---
    max_score += 35
    repo_fw_lower = {fw.lower() for fw in repo.frameworks}
    idea_fw_lower = {fw.lower() for fw in signals.frameworks}
    common_fw = repo_fw_lower & idea_fw_lower
    if signals.frameworks:
        if common_fw:
            # Overlap ratio
            ratio = len(common_fw) / max(len(idea_fw_lower), 1)
            fw_score = min(35, round(35 * (0.6 + 0.4 * ratio)))
            score += fw_score
            for fw in repo.frameworks:
                if fw.lower() in common_fw:
                    matched.append(fw)
            reasons.append(f"framework overlap ({', '.join(common_fw)})")
        else:
            # no framework match but idea specified frameworks
            pass
    else:
        # user didn't specify framework → give partial credit
        score += 12

    # --- Architecture pattern match (weight 25) ---
    max_score += 25
    pat_lower = repo.architecture_pattern.lower()
    idea_pat_lower = [p.lower() for p in signals.patterns]
    if signals.patterns:
        for ip in idea_pat_lower:
            if ip in pat_lower or pat_lower in ip:
                score += 25
                matched.append(repo.architecture_pattern)
                reasons.append(f"architecture match ({repo.architecture_pattern})")
                break
        else:
            score += 3  # slight credit even if no pattern match
    else:
        score += 10  # user didn't specify → neutral

    # --- Concept/keyword match (weight 15) ---
    max_score += 15
    idea_text_lower = signals.raw_text.lower()
    readme_lower = repo.readme_snippet.lower()
    concept_hits = 0
    for concept in signals.concepts:
        synonyms = CONCEPT_KEYWORDS.get(concept, set())
        if any(syn in readme_lower for syn in synonyms):
            concept_hits += 1
    if signals.concepts:
        concept_ratio = concept_hits / max(len(signals.concepts), 1)
        concept_score = round(15 * concept_ratio)
        score += concept_score
        if concept_hits:
            reasons.append(f"{concept_hits}/{len(signals.concepts)} concept(s) found in README")
    else:
        score += 8

    # Normalise to 0–100
    raw_pct = (score / max_score) * 100 if max_score > 0 else 0

    # Add small diversity jitter based on stars (helps differentiate similar scores)
    stars_boost = min(5, math.log10(max(repo.stars, 1)) * 0.5)
    raw_pct = min(98, raw_pct + stars_boost)

    match_pct = max(5, round(raw_pct))

    # Build rationale
    if not reasons:
        rationale = f"General structural similarity to a **{repo.architecture_pattern}** project."
    else:
        rationale = "Matched on: " + "; ".join(reasons) + f". Pattern: **{repo.architecture_pattern}**."

    return match_pct, matched, rationale


def analyze_idea(idea_text: str, top_n: int = 8) -> tuple[list[RepoMatch], IdeaSignals]:
    """
    Main entry point.
    Returns (top-N RepoMatch objects, extracted IdeaSignals).
    """
    signals = _extract_signals(idea_text)
    repos = _load_repos()

    scored: list[tuple[int, RepoSignals, list[str], str]] = []
    for repo in repos:
        pct, matched_signals, rationale = _score_repo(repo, signals)
        scored.append((pct, repo, matched_signals, rationale))

    # Sort descending by match %, then descending by stars for tie-breaking
    scored.sort(key=lambda x: (x[0], x[1].stars), reverse=True)

    results: list[RepoMatch] = []
    seen_patterns: set[str] = set()

    for pct, repo, matched_signals, rationale in scored:
        # Deduplicate: allow at most 2 repos with same architecture pattern
        pat_key = repo.architecture_pattern
        if list(seen_patterns).count(pat_key) >= 2:
            continue
        seen_patterns.add(pat_key)

        # Build display signals list
        display_signals: list[str] = []
        if repo.language:
            display_signals.append(repo.language)
        for fw in repo.frameworks[:2]:
            display_signals.append(fw)
        if repo.architecture_pattern and repo.architecture_pattern not in display_signals:
            display_signals.append(repo.architecture_pattern)

        results.append(
            RepoMatch(
                repo_name=repo.full_name,
                github_url=repo.github_url,
                language=repo.language,
                stars=repo.stars,
                architecture_pattern=repo.architecture_pattern,
                detected_signals=display_signals,
                match_pct=pct,
                rationale=rationale,
                source_tier=repo.source_tier,
            )
        )
        if len(results) >= top_n:
            break

    return results, signals
