"""
Phase 0: Dataset Audit & Ground Truth Validation
Inspects cleaned repository records to detect duplicates, measure distribution,
and determine whether modeling should be single-label multi-class or multi-label.
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "model_ready" / "cleaned_repository_samples.jsonl"
REPORT_PATH = BASE_DIR / "data" / "model_ready" / "audit_report.json"


def audit_dataset() -> dict:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at: {DATA_PATH}")

    total_records = 0
    unique_ids: set[int] = set()
    unique_slugs: set[str] = set()
    duplicate_ids = 0
    duplicate_slugs = 0

    empty_readmes = 0
    short_readmes = 0  # < 100 characters

    pattern_counts: Counter[str] = Counter()
    language_counts: Counter[str] = Counter()
    joint_counts: Counter[tuple[str, str]] = Counter()
    tier_counts: Counter[str] = Counter()

    records_with_diagrams = 0
    records_with_arch_docs = 0

    print(f"🔍 Reading dataset from: {DATA_PATH}...")

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue

            record = json.loads(line)
            total_records += 1

            # 1. Identity & Deduplication check
            repo_id = record.get("id")
            full_name = record.get("fullName") or record.get("name", "")

            if repo_id in unique_ids:
                duplicate_ids += 1
            else:
                unique_ids.add(repo_id)

            if full_name.lower() in unique_slugs:
                duplicate_slugs += 1
            else:
                unique_slugs.add(full_name.lower())

            # 2. README Quality check
            readme = record.get("cleanedReadme", "")
            if not readme or len(readme.strip()) == 0:
                empty_readmes += 1
            elif len(readme.strip()) < 100:
                short_readmes += 1

            # 3. Categorical signals
            arch = record.get("architecturePattern", "Unknown")
            lang = record.get("language", "Unknown")
            tier = record.get("sourceTier", "unknown")

            pattern_counts[arch] += 1
            language_counts[lang] += 1
            joint_counts[(lang, arch)] += 1
            tier_counts[tier] += 1

            # 4. Contextual assets
            if record.get("validDiagramsCount", 0) > 0 or record.get("diagramTypes"):
                records_with_diagrams += 1
            if record.get("cleanedArchitectureDocs"):
                records_with_arch_docs += 1

    # 5. Determine Cardinality & Imbalance Severity
    majority_pattern, majority_pattern_count = pattern_counts.most_common(1)[0]
    majority_pattern_pct = (majority_pattern_count / total_records) * 100

    majority_lang, majority_lang_count = language_counts.most_common(1)[0]
    majority_lang_pct = (majority_lang_count / total_records) * 100

    # Format Joint Matrix for the top languages and architectures
    joint_matrix = [
        {"language": lang, "architecture": arch, "count": count}
        for (lang, arch), count in joint_counts.most_common(30)
    ]

    report = {
        "dataset_path": str(DATA_PATH),
        "total_records": total_records,
        "unique_repositories": len(unique_ids),
        "duplicate_ids": duplicate_ids,
        "duplicate_slugs": duplicate_slugs,
        "data_hygiene": {
            "empty_readmes": empty_readmes,
            "short_readmes": short_readmes,
            "records_with_diagrams": records_with_diagrams,
            "records_with_arch_docs": records_with_arch_docs,
        },
        "cardinality": {
            "unique_architecture_classes": len(pattern_counts),
            "unique_languages": len(language_counts),
            "label_structure": "single_label_multiclass",
            "majority_pattern": f"{majority_pattern} ({majority_pattern_count} repos, {majority_pattern_pct:.1f}%)",
            "majority_language": f"{majority_lang} ({majority_lang_count} repos, {majority_lang_pct:.1f}%)",
        },
        "distributions": {
            "architecture_patterns": dict(pattern_counts.most_common(15)),
            "languages": dict(language_counts.most_common(15)),
            "tiers": dict(tier_counts),
        },
        "joint_language_architecture_top30": joint_matrix,
    }

    # Save report
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 60)
    print("📊 DATASET AUDIT SUMMARY")
    print("=" * 60)
    print(f"Total Records:         {total_records}")
    print(f"Unique Repositories:   {len(unique_ids)} (Duplicates: {duplicate_ids})")
    print(f"Empty/Short READMEs:   {empty_readmes} empty, {short_readmes} < 100 chars")
    print(f"Repos with Diagrams:   {records_with_diagrams}")
    print(f"Unique Architectures:  {len(pattern_counts)}")
    print(f"Unique Languages:      {len(language_counts)}")
    print(f"Majority Architecture: {majority_pattern} ({majority_pattern_pct:.1f}%)")
    print(f"Majority Language:     {majority_lang} ({majority_lang_pct:.1f}%)")
    print(f"\n📁 Full report saved to: {REPORT_PATH}")
    print("=" * 60)

    return report


if __name__ == "__main__":
    audit_dataset()
