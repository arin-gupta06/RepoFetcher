import sys
from pathlib import Path

# Fix Windows OpenMP and encoding
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))
from model import predict_architecture

test_cases = [
    {
        "name": "NestJS Clean Architecture",
        "lang": "TypeScript",
        "fws": ["NestJS"],
        "layers": ["controllers", "services", "repositories", "domain", "ports", "adapters"],
        "readme": "Clean Architecture and Domain-Driven Design in NestJS with hexagonal ports.",
        "stars": 12000,
        "expected": "Clean Architecture",
    },
    {
        "name": "FastAPI Microservice",
        "lang": "Python",
        "fws": ["FastAPI"],
        "layers": ["handlers", "services", "models", "infrastructure"],
        "readme": "Distributed microservices architecture with FastAPI and asynchronous messaging.",
        "stars": 8500,
        "expected": "Microservices",
    },
    {
        "name": "Go Event-Driven CQRS",
        "lang": "Go",
        "fws": ["Gin"],
        "layers": ["commands", "queries", "aggregates", "events", "infrastructure"],
        "readme": "CQRS and Event Sourcing engine implemented in Golang with event store.",
        "stars": 4200,
        "expected": "Event-Driven",
    },
    {
        "name": "Spring Boot Hexagonal",
        "lang": "Java",
        "fws": ["Spring Boot"],
        "layers": ["adapters", "ports", "domain", "application", "infrastructure"],
        "readme": "Hexagonal architecture ports and adapters with Spring Boot.",
        "stars": 9100,
        "expected": "Hexagonal",
    },
    {
        "name": "Django Web Application",
        "lang": "Python",
        "fws": ["Django"],
        "layers": ["views", "models", "templates", "urls", "forms"],
        "readme": "Full-stack web application powered by Django framework.",
        "stars": 6400,
        "expected": "Modular",
    },
]

def run_validation():
    print("=" * 65)
    print("🎯 REPOLENS AI — DISTILBERT PREDICTION ACCURACY & BENCHMARK AUDIT")
    print("=" * 65)

    passed = 0
    for idx, tc in enumerate(test_cases, 1):
        res = predict_architecture(
            language=tc["lang"],
            frameworks=tc["fws"],
            layers=tc["layers"],
            stars=tc["stars"],
            total_files=90,
            has_arch_docs=True,
            readme_snippet=tc["readme"],
            repo_name="test/" + tc["name"].lower().replace(" ", "-"),
        )

        match = (tc["expected"].lower() in res.top_pattern.lower()) or (res.top_pattern.lower() in tc["expected"].lower())
        if match:
            passed += 1
            status = "✅ ACCURATE"
        else:
            status = "⚠️ REVIEW"

        print(f"\n[{idx}/{len(test_cases)}] {tc['name']} -> {status}")
        print(f"   Expected:           {tc['expected']}")
        print(f"   Predicted Pattern:  {res.top_pattern} (Confidence: {res.confidence * 100:.1f}%)")
        print(f"   Closest Benchmark:  {res.closest_match.full_name} ({res.closest_match.stars:,} stars, similarity: {res.closest_match.similarity_score:.2f})")
        print(f"   Benchmark URL:      {res.closest_match.url}")
        print(f"   Adherence Score:    {res.analysis_stats.pattern_adherence_score}% | Modularity: {res.analysis_stats.modularity_index}%")
        print(f"   Top Evidence:       {res.top_candidates[0].evidence[-1] if res.top_candidates else 'N/A'}")

    print("\n" + "=" * 65)
    print(f"RESULTS: {passed}/{len(test_cases)} tests aligned with architectural ground truth ({passed / len(test_cases) * 100:.0f}%)")
    print("=" * 65)

if __name__ == "__main__":
    run_validation()
