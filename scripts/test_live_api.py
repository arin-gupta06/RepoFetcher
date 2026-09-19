import urllib.request
import json

def test_live_api():
    # 1. Test /predict
    req_data = json.dumps({
        "repo_name": "test/nest-clean-arch",
        "language": "TypeScript",
        "frameworks": ["NestJS"],
        "layers": ["controllers", "services", "repositories", "domain"],
        "stars": 4500,
        "total_files": 75,
        "has_arch_docs": True,
        "readme_snippet": "Clean Architecture demonstration in NestJS with hexagonal ports.",
    }).encode("utf-8")

    req = urllib.request.Request(
        "http://localhost:8000/predict",
        data=req_data,
        headers={"Content-Type": "application/json"},
    )

    print("Testing POST http://localhost:8000/predict (initial cold-start load may take ~15s)...")
    with urllib.request.urlopen(req, timeout=45) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        print("Prediction status:", resp.status)
        print("Predicted Pattern:", result.get("top_pattern"))
        print("Confidence:", result.get("confidence"))
        bm = result.get("closest_match", {})
        print("Closest Benchmark:", bm.get("full_name"), "similarity:", bm.get("similarity_score"))
        if result.get("top_candidates"):
            print("Top candidate evidence:", result["top_candidates"][0]["evidence"])

    # 2. Test /analyze-idea
    idea_data = json.dumps({
        "idea": "A real-time fintech payment gateway with CQRS and event sourcing"
    }).encode("utf-8")

    req_idea = urllib.request.Request(
        "http://localhost:8000/analyze-idea",
        data=idea_data,
        headers={"Content-Type": "application/json"},
    )

    print("\nTesting POST http://localhost:8000/analyze-idea...")
    with urllib.request.urlopen(req_idea, timeout=10) as resp:
        idea_res = json.loads(resp.read().decode("utf-8"))
        print("Idea status:", resp.status)
        print("Matches returned:", len(idea_res.get("matches", [])))
        for m in idea_res.get("matches", [])[:3]:
            print(f"   * {m.get('repo_name')} ({m.get('match_pct')}%): {m.get('rationale')}")

if __name__ == "__main__":
    test_live_api()
