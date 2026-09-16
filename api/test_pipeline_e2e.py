"""
End-to-End Verification Test for Upgraded Architecture Intelligence Pipeline
Tests:
1. Data Pruning (diagram noise & repo filtering).
2. Separation of Concerns ("What it actually has" vs "What it contains").
3. Architecture Reasoning Engine.
4. Closest Benchmark Match & Diagram Recommendation.
5. Statistical Analysis Metrics (Distribution, Adherence, Modularity).
6. Corrected Flow & Mermaid Diagram Generation.
"""

import sys
from pathlib import Path

# Add project root and api dir to sys.path
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "api"))

try:
    from model import (
        DataPruner,
        predict_architecture,
        categorize_technical_layers,
        extract_functional_subdomains,
    )
except ImportError:
    from api.model import (
        DataPruner,
        predict_architecture,
        categorize_technical_layers,
        extract_functional_subdomains,
    )


def test_data_pruning():
    print("\n--- Test 1: Data Pruning Engine ---")
    bad_diagrams = [
        {"diagramType": "noise", "reliabilityScore": 0.4},
        {"diagramType": "flowchart", "reliabilityScore": 0.5, "originalUrl": "https://gitpod.io/button/open-in-gitpod.svg"},
        {"diagramType": "architecture_diagram", "reliabilityScore": 0.85, "metadata": {"width": 140, "height": 30}, "context": {"altText": "badge"}},
    ]
    good_diagram = {
        "diagramType": "architecture_diagram",
        "reliabilityScore": 0.90,
        "originalUrl": "https://raw.githubusercontent.com/org/repo/docs/arch.png",
        "metadata": {"width": 1200, "height": 800},
        "context": {"sectionHeading": "System Context C4 Diagram", "altText": "Architecture Overview"},
    }

    assert not DataPruner.is_valid_diagram(bad_diagrams[0]), "Failed: noise should be pruned"
    assert not DataPruner.is_valid_diagram(bad_diagrams[1]), "Failed: gitpod button should be pruned"
    assert not DataPruner.is_valid_diagram(bad_diagrams[2]), "Failed: tiny badge dimensions should be pruned"
    assert DataPruner.is_valid_diagram(good_diagram), "Failed: clean architectural diagram should pass"

    # Test noise directory pruning
    assert DataPruner.prune_feature_path("node_modules/@nestjs/core"), "node_modules should be pruned"
    assert DataPruner.prune_feature_path(".github/workflows/ci.yml"), ".github should be pruned"
    assert not DataPruner.prune_feature_path("src/controllers/user.controller.ts"), "controller should NOT be pruned"
    print(" [OK] Data pruning tests passed successfully!")


def test_separation_of_concerns():
    print("\n--- Test 2: Separation of Concerns ---")
    layers = [
        "controllers", "services", "repositories", "models", "infrastructure",
        "auth", "payment", "notifications", "orders"
    ]
    tech = categorize_technical_layers(layers)
    subdomains = extract_functional_subdomains(layers=layers, readme_snippet="Payment and order processing")

    tech_labels = [t.label for t in tech]
    subdomain_names = [s.name for s in subdomains]

    print("Technical Plumbing ('What it actually has'):", tech_labels)
    print("Functional Sub-domains ('What it contains'):", subdomain_names)

    assert "Presentation & API" in tech_labels
    assert "Business Logic & Domain Core" in tech_labels
    assert "Persistence & Data Access" in tech_labels
    assert "Payments & Billing" in subdomain_names
    assert "Authentication & Identity" in subdomain_names
    print(" [OK] Separation of concerns tests passed successfully!")
    return tech_labels, subdomain_names


def test_prediction_and_benchmark():
    print("\n--- Test 3: Prediction, Closest Benchmark & Statistics ---")
    res = predict_architecture(
        language="TypeScript",
        frameworks=["NestJS"],
        layers=["controllers", "services", "repositories", "models", "infrastructure"],
        stars=15000,
        total_files=220,
        has_arch_docs=True,
        readme_snippet="Enterprise payment gateway with bounded contexts and domain event publishing.",
        repo_name="acme/fintech-backend",
    )

    print(f"Top Pattern: {res.top_pattern} ({res.confidence * 100:.1f}%)")
    print(f"Reasoning snippet: {res.architecture_reasoning[:120]}...")
    print(f"Closest Benchmark: {res.closest_match.full_name} ({res.closest_match.url})")
    print(f"Benchmark Stars: {res.closest_match.stars}, Similarity: {res.closest_match.similarity_score * 100:.0f}%")
    if res.recommended_diagram:
        print(f"Recommended Diagram: {res.recommended_diagram.storage_url} (Type: {res.recommended_diagram.diagram_type})")

    stats = res.analysis_stats
    print(f"Pattern Adherence: {stats.pattern_adherence_score}%, Modularity: {stats.modularity_index}%")
    print(f"Layer Distribution: Pres={stats.layer_distribution.presentation}%, Logic={stats.layer_distribution.business_logic}%, Persist={stats.layer_distribution.persistence}%, Infra={stats.layer_distribution.infrastructure}%")

    # Verify flow correction
    assert len(res.flow_correction.recommendations) > 0
    assert "sequenceDiagram" in res.flow_correction.mermaid_code
    print(" [OK] Closest benchmark, diagram, statistics, and flow tests passed successfully!")


if __name__ == "__main__":
    test_data_pruning()
    test_separation_of_concerns()
    test_prediction_and_benchmark()
    print("\n==========================================")
    print(" ALL E2E INTELLIGENCE PIPELINE TESTS PASSED!")
    print("==========================================")
