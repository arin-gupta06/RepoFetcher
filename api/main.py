"""
RepoLens AI — FastAPI Backend
Serves architecture pattern predictions and dataset statistics.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import predict_architecture, PredictionCandidate
from idea_analyzer import analyze_idea, RepoMatch, IdeaSignals

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="RepoLens AI API",
    description="Software architecture intelligence — predict patterns from repository metadata.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to dataset summary (relative to repo root from api/)
DATASET_SUMMARY_PATH = Path(__file__).parent.parent / "data" / "model_ready" / "dataset_summary.json"


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RepoMetadata(BaseModel):
    repo_name: str = Field(..., example="expressjs/express")
    language: str = Field(..., example="TypeScript")
    frameworks: list[str] = Field(default_factory=list, example=["Express"])
    layers: list[str] = Field(
        default_factory=list,
        example=["controllers", "services", "repositories", "models"],
    )
    stars: int = Field(default=0, ge=0, example=12000)
    total_files: int = Field(default=0, ge=0, example=85)
    has_arch_docs: bool = Field(default=False)
    readme_snippet: str = Field(default="", max_length=2000)


class CandidateResponse(BaseModel):
    pattern: str
    confidence: float
    evidence: list[str]


class PredictResponse(BaseModel):
    top_pattern: str
    confidence: float
    top_candidates: list[CandidateResponse]
    rationale: str
    source_tier_hint: str
    model_info: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Meta"])
def health() -> dict:
    return {"status": "ok", "service": "RepoLens AI API", "version": "1.0.0"}


@app.get("/stats", tags=["Data"])
def get_stats() -> dict:
    """Return the dataset summary statistics."""
    if not DATASET_SUMMARY_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Dataset summary not found. Run the data pipeline first.",
        )
    with open(DATASET_SUMMARY_PATH, encoding="utf-8") as f:
        return json.load(f)


@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
def predict(repo: RepoMetadata) -> PredictResponse:
    """
    Predict the software architecture pattern for a given repository.

    Input repository metadata and receive:
    - The top predicted architecture pattern
    - Confidence score
    - Top-3 candidate patterns with evidence
    - Human-readable rationale
    """
    result = predict_architecture(
        language=repo.language,
        frameworks=repo.frameworks,
        layers=repo.layers,
        stars=repo.stars,
        total_files=repo.total_files,
        has_arch_docs=repo.has_arch_docs,
        readme_snippet=repo.readme_snippet,
    )

    return PredictResponse(
        top_pattern=result.top_pattern,
        confidence=result.confidence,
        top_candidates=[
            CandidateResponse(
                pattern=c.pattern,
                confidence=c.confidence,
                evidence=c.evidence,
            )
            for c in result.top_candidates
        ],
        rationale=result.rationale,
        source_tier_hint=result.source_tier_hint,
        model_info="Rule-based heuristic classifier (v1) — export notebook model weights to upgrade to BiLSTM/DistilBERT inference.",
    )


# ---------------------------------------------------------------------------
# Idea Analyzer endpoint
# ---------------------------------------------------------------------------

class IdeaRequest(BaseModel):
    idea: str = Field(..., min_length=10, max_length=2000, example="A REST API for task management with authentication and PostgreSQL")
    top_n: int = Field(default=8, ge=1, le=20)


class SignalsResponse(BaseModel):
    languages: list[str]
    frameworks: list[str]
    patterns: list[str]
    concepts: list[str]


class RepoMatchResponse(BaseModel):
    repo_name: str
    github_url: str
    language: str
    stars: int
    architecture_pattern: str
    detected_signals: list[str]
    match_pct: int
    rationale: str
    source_tier: str


class IdeaAnalysisResponse(BaseModel):
    matches: list[RepoMatchResponse]
    extracted_signals: SignalsResponse
    total_repos_searched: int


@app.post("/analyze-idea", response_model=IdeaAnalysisResponse, tags=["Idea Analyzer"])
def analyze_idea_endpoint(req: IdeaRequest) -> IdeaAnalysisResponse:
    """
    Analyze a free-text project idea and return similar repositories.

    Extracts language/framework/architecture signals from the idea description,
    then scores every repo in the training dataset and returns the top matches
    with a match percentage.
    """
    matches, signals = analyze_idea(req.idea, top_n=req.top_n)

    return IdeaAnalysisResponse(
        matches=[
            RepoMatchResponse(
                repo_name=m.repo_name,
                github_url=m.github_url,
                language=m.language,
                stars=m.stars,
                architecture_pattern=m.architecture_pattern,
                detected_signals=m.detected_signals,
                match_pct=m.match_pct,
                rationale=m.rationale,
                source_tier=m.source_tier,
            )
            for m in matches
        ],
        extracted_signals=SignalsResponse(
            languages=signals.languages,
            frameworks=signals.frameworks,
            patterns=signals.patterns,
            concepts=signals.concepts,
        ),
        total_repos_searched=len(list(
            open(Path(__file__).parent.parent / "data" / "model_ready" / "cleaned_repository_samples.jsonl")
        )) if (Path(__file__).parent.parent / "data" / "model_ready" / "cleaned_repository_samples.jsonl").exists() else 0,
    )
