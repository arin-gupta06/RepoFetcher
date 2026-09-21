"""
RepoLens AI — FastAPI Backend
Serves architecture pattern predictions and dataset statistics.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

API_DIR = Path(__file__).parent
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from model import predict_architecture, PredictionCandidate
from idea_analyzer import analyze_idea, RepoMatch, IdeaSignals
from github_detector import detect_repository_metadata

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="RepoLens AI API",
    description="Software architecture intelligence — predict patterns from repository metadata.",
    version="1.0.0",
)

cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()
if cors_origins_env:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    allow_credentials = "*" not in allowed_origins
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to dataset summary (relative to repo root from api/)
DATASET_SUMMARY_PATH = Path(__file__).parent.parent / "data" / "model_ready" / "dataset_summary.json"


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RepoMetadata(BaseModel):
    repo_name: str = Field(..., examples=["expressjs/express"])
    language: str = Field(..., examples=["TypeScript"])
    frameworks: list[str] = Field(default_factory=list, examples=[["Express"]])
    layers: list[str] = Field(
        default_factory=list,
        examples=[["controllers", "services", "repositories", "models"]],
    )
    stars: int = Field(default=0, ge=0, examples=[12000])
    total_files: int = Field(default=0, ge=0, examples=[85])
    has_arch_docs: bool = Field(default=False)
    readme_snippet: str = Field(default="", max_length=2000)


class CandidateResponse(BaseModel):
    pattern: str
    confidence: float
    evidence: list[str]


class TechnicalComponentResponse(BaseModel):
    category: str
    label: str
    items: list[str]
    description: str


class FunctionalSubdomainResponse(BaseModel):
    name: str
    confidence: float
    evidence: list[str]
    description: str


class ClosestBenchmarkResponse(BaseModel):
    name: str
    owner: str
    full_name: str
    url: str
    stars: int
    source_tier: str
    similarity_score: float
    pattern: str


class RecommendedDiagramResponse(BaseModel):
    storage_url: str
    original_url: str
    diagram_type: str
    caption: str
    reliability_score: float


class LayerDistributionResponse(BaseModel):
    presentation: float
    business_logic: float
    persistence: float
    infrastructure: float


class AnalysisStatisticsResponse(BaseModel):
    layer_distribution: LayerDistributionResponse
    pattern_adherence_score: int
    modularity_index: int
    coupling_risk: str
    maintainability_rating: str


class ComparisonStatisticsResponse(BaseModel):
    input_stats: AnalysisStatisticsResponse
    benchmark_stats: AnalysisStatisticsResponse
    delta_adherence: int
    delta_modularity: int
    summary: str


class FlowCorrectionResponse(BaseModel):
    title: str
    detected_gaps: list[str]
    recommendations: list[str]
    mermaid_code: str


class PredictResponse(BaseModel):
    top_pattern: str
    confidence: float
    top_candidates: list[CandidateResponse]
    rationale: str
    source_tier_hint: str
    technical_structure: list[TechnicalComponentResponse]
    functional_subdomains: list[FunctionalSubdomainResponse]
    architecture_reasoning: str
    closest_match: ClosestBenchmarkResponse
    recommended_diagram: Optional[RecommendedDiagramResponse] = None
    analysis_stats: AnalysisStatisticsResponse
    comparison: ComparisonStatisticsResponse
    flow_correction: FlowCorrectionResponse
    model_info: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Meta"])
def health() -> dict:
    return {"status": "ok", "service": "RepoLens AI API", "version": "2.0.0"}


import math

def compute_symmetry_telemetry() -> dict[str, Any]:
    if not DATASET_SUMMARY_PATH.exists():
        return {"symmetry_score": 14.8, "status": "no_summary"}
    with open(DATASET_SUMMARY_PATH, encoding="utf-8") as f:
        summary = json.load(f)

    total = summary.get("cleanedSamplesCount") or summary.get("totalHarvestedRepos") or 3265
    lang_counts = summary.get("languageDistribution", {})
    arch_counts = summary.get("architecturePatternsDistribution", {})

    def analyze(counts: dict[str, int]):
        K = len(counts)
        if K == 0 or total == 0:
            return 0.0, 0.0, [], []
        target = 1.0 / K
        sum_p_log_p = 0.0
        sum_p_sq = 0.0
        starved, saturated = [], []
        for name, cnt in counts.items():
            p = cnt / total
            if p > 0:
                sum_p_log_p += p * math.log(p + 1e-9)
                sum_p_sq += p * p
            deficit = (target - p) / target
            if cnt < 5:
                tier_name = "Tier 1: Emergency"
            elif cnt < 15:
                tier_name = "Tier 2: Critical"
            elif cnt < 30:
                tier_name = "Tier 3: Developing"
            elif cnt < 60:
                tier_name = "Tier 4: Usable"
            else:
                tier_name = "Tier 5: Saturated"
            metric = {
                "name": name,
                "count": cnt,
                "percentage": round(p * 100, 2),
                "deficit": round(deficit * 100, 1),
                "tier": tier_name,
            }
            if cnt < 15 or p < 0.4 * target:
                starved.append(metric)
            elif cnt >= 60 or p > 1.5 * target:
                saturated.append(metric)
        h_norm = -sum_p_log_p / math.log(K) if K > 1 else 1.0
        gs = 1.0 - sum_p_sq
        return max(0.0, min(1.0, h_norm)), max(0.0, min(1.0, gs)), starved, saturated

    lang_h, lang_gs, starved_langs, sat_langs = analyze(lang_counts)
    arch_h, arch_gs, starved_archs, sat_archs = analyze(arch_counts)
    avg_h = (lang_h + arch_h) / 2.0
    avg_gs = (lang_gs + arch_gs) / 2.0
    symmetry_score = round(avg_h * min(1.0, avg_gs * 1.05) * 100, 1)

    return {
        "symmetry_score": symmetry_score,
        "language_entropy": round(lang_h, 4),
        "language_gini_simpson": round(lang_gs, 4),
        "architecture_entropy": round(arch_h, 4),
        "architecture_gini_simpson": round(arch_gs, 4),
        "starved_categories": {
            "languages": starved_langs[:8],
            "architectures": starved_archs[:8],
        },
        "saturated_categories": {
            "languages": sat_langs[:5],
            "architectures": sat_archs[:5],
        },
    }


@app.get("/dataset/symmetry", tags=["Data"])
def get_dataset_symmetry() -> dict:
    """Return live dataset symmetry and skewness metrics."""
    return compute_symmetry_telemetry()


@app.post("/harvest/plan", tags=["Data"])
def get_harvest_plan() -> dict:
    """Return active dynamic harvest priorities to normalize skewness."""
    telemetry = compute_symmetry_telemetry()
    starved_langs = [l["name"] for l in telemetry.get("starved_categories", {}).get("languages", [])]
    starved_archs = [a["name"] for a in telemetry.get("starved_categories", {}).get("architectures", [])]
    return {
        "symmetry_score": telemetry.get("symmetry_score", 14.8),
        "harvest_mode": "adaptive",
        "starved_languages": starved_langs,
        "starved_architectures": starved_archs,
        "recommended_page_allocation": {
            "starved": 4,
            "balanced": 2,
            "saturated": 0,
        },
    }


@app.get("/stats", tags=["Data"])
def get_stats() -> dict:
    """Return the dataset summary statistics enriched with symmetry metrics."""
    if not DATASET_SUMMARY_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Dataset summary not found. Run the data pipeline first.",
        )
    with open(DATASET_SUMMARY_PATH, encoding="utf-8") as f:
        data = json.load(f)
    data["symmetry_telemetry"] = compute_symmetry_telemetry()
    return data


@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
def predict(repo: RepoMetadata) -> PredictResponse:
    """
    Predict software architecture with deep reasoning, progressive disclosure of
    technical structure vs. functional sub-domains, closest benchmark match with diagrams,
    statistical analysis, and corrected flow recommendations.
    """
    result = predict_architecture(
        language=repo.language,
        frameworks=repo.frameworks,
        layers=repo.layers,
        stars=repo.stars,
        total_files=repo.total_files,
        has_arch_docs=repo.has_arch_docs,
        readme_snippet=repo.readme_snippet,
        repo_name=repo.repo_name,
    )

    # Map diagram if available
    rec_diag = None
    if result.recommended_diagram:
        rec_diag = RecommendedDiagramResponse(
            storage_url=result.recommended_diagram.storage_url,
            original_url=result.recommended_diagram.original_url,
            diagram_type=result.recommended_diagram.diagram_type,
            caption=result.recommended_diagram.caption,
            reliability_score=result.recommended_diagram.reliability_score,
        )

    # Map input stats
    in_dist = LayerDistributionResponse(
        presentation=result.analysis_stats.layer_distribution.presentation,
        business_logic=result.analysis_stats.layer_distribution.business_logic,
        persistence=result.analysis_stats.layer_distribution.persistence,
        infrastructure=result.analysis_stats.layer_distribution.infrastructure,
    )
    in_stats = AnalysisStatisticsResponse(
        layer_distribution=in_dist,
        pattern_adherence_score=result.analysis_stats.pattern_adherence_score,
        modularity_index=result.analysis_stats.modularity_index,
        coupling_risk=result.analysis_stats.coupling_risk,
        maintainability_rating=result.analysis_stats.maintainability_rating,
    )

    # Map benchmark stats
    bm_dist = LayerDistributionResponse(
        presentation=result.comparison.benchmark_stats.layer_distribution.presentation,
        business_logic=result.comparison.benchmark_stats.layer_distribution.business_logic,
        persistence=result.comparison.benchmark_stats.layer_distribution.persistence,
        infrastructure=result.comparison.benchmark_stats.layer_distribution.infrastructure,
    )
    bm_stats = AnalysisStatisticsResponse(
        layer_distribution=bm_dist,
        pattern_adherence_score=result.comparison.benchmark_stats.pattern_adherence_score,
        modularity_index=result.comparison.benchmark_stats.modularity_index,
        coupling_risk=result.comparison.benchmark_stats.coupling_risk,
        maintainability_rating=result.comparison.benchmark_stats.maintainability_rating,
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
        technical_structure=[
            TechnicalComponentResponse(
                category=t.category,
                label=t.label,
                items=t.items,
                description=t.description,
            )
            for t in result.technical_structure
        ],
        functional_subdomains=[
            FunctionalSubdomainResponse(
                name=s.name,
                confidence=s.confidence,
                evidence=s.evidence,
                description=s.description,
            )
            for s in result.functional_subdomains
        ],
        architecture_reasoning=result.architecture_reasoning,
        closest_match=ClosestBenchmarkResponse(
            name=result.closest_match.name,
            owner=result.closest_match.owner,
            full_name=result.closest_match.full_name,
            url=result.closest_match.url,
            stars=result.closest_match.stars,
            source_tier=result.closest_match.source_tier,
            similarity_score=result.closest_match.similarity_score,
            pattern=result.closest_match.pattern,
        ),
        recommended_diagram=rec_diag,
        analysis_stats=in_stats,
        comparison=ComparisonStatisticsResponse(
            input_stats=in_stats,
            benchmark_stats=bm_stats,
            delta_adherence=result.comparison.delta_adherence,
            delta_modularity=result.comparison.delta_modularity,
            summary=result.comparison.summary,
        ),
        flow_correction=FlowCorrectionResponse(
            title=result.flow_correction.title,
            detected_gaps=result.flow_correction.detected_gaps,
            recommendations=result.flow_correction.recommendations,
            mermaid_code=result.flow_correction.mermaid_code,
        ),
        model_info=result.model_info,
    )


# ---------------------------------------------------------------------------
# GitHub Repository Auto-Detector Endpoint
# ---------------------------------------------------------------------------

class DetectRepoRequest(BaseModel):
    url: Optional[str] = Field(default=None, examples=["https://github.com/expressjs/express"])
    github_url: Optional[str] = Field(default=None, examples=["https://github.com/expressjs/express"])


class DetectRepoResponse(BaseModel):
    repo_name: str
    language: str
    stars: int
    total_files: int
    frameworks: list[str]
    layers: list[str]
    has_arch_docs: bool
    readme_snippet: str


@app.post("/detect-repo", response_model=DetectRepoResponse, tags=["Detector"])
@app.post("/detect-github", response_model=DetectRepoResponse, tags=["Detector"])
def detect_repo_endpoint(req: DetectRepoRequest) -> DetectRepoResponse:
    """
    Given a GitHub URL or slug (e.g. 'expressjs/express' or 'https://github.com/expressjs/express'),
    fetches live repository metadata, stars, language, frameworks, layers, and README snippet
    to automatically populate the client-side architecture analysis form.
    """
    target = (req.url or req.github_url or "").strip()
    if not target:
        raise HTTPException(
            status_code=400,
            detail="Repository URL or slug is required (e.g. 'expressjs/express' or 'https://github.com/expressjs/express')."
        )
    try:
        data = detect_repository_metadata(target)
        return DetectRepoResponse(**data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inspect repository: {str(e)}")


# ---------------------------------------------------------------------------
# Idea Analyzer endpoint
# ---------------------------------------------------------------------------

class IdeaRequest(BaseModel):
    idea: str = Field(..., min_length=10, max_length=2000, examples=["A REST API for task management with authentication and PostgreSQL"])
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
            open(Path(__file__).parent.parent / "data" / "model_ready" / "cleaned_repository_samples.jsonl", encoding="utf-8")
        )) if (Path(__file__).parent.parent / "data" / "model_ready" / "cleaned_repository_samples.jsonl").exists() else 0,
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)
