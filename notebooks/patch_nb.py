"""
Patch script: fix classification_report ValueError in architecture_model.ipynb.

Root cause: the test split is small (7-40 samples) so it only contains a subset
of the 52 architecture-pattern classes. Passing label_encoder.classes_ (all 52)
to classification_report causes:
    ValueError: Number of classes, 11, does not match size of target_names, 52.

Fix: add a safe_report() helper that derives labels/target_names from only the
classes actually present in the current y_true / y_pred arrays.
"""

import json, re

NB_PATH = "notebooks/architecture_model.ipynb"

with open(NB_PATH, encoding="utf-8") as f:
    nb = json.load(f)

# ── Helper source lines we will insert (as a new code cell) ──────────────────
HELPER_CELL_SOURCE = [
    "# ── safe_report: only use labels that appear in this split ──────────────\n",
    "def safe_report(y_true, y_pred):\n",
    "    \"\"\"classification_report restricted to labels present in y_true/y_pred.\n",
    "    Avoids ValueError when the test split doesn't contain every class.\n",
    "    \"\"\"\n",
    "    present_labels = sorted(set(list(y_true) + list(y_pred)))\n",
    "    present_names  = [label_encoder.classes_[i] for i in present_labels]\n",
    "    return classification_report(\n",
    "        y_true, y_pred,\n",
    "        labels=present_labels,\n",
    "        target_names=present_names,\n",
    "        zero_division=0\n",
    "    )\n",
]

HELPER_CELL = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": HELPER_CELL_SOURCE,
}

# ── Old / new source patterns for each broken report call ────────────────────
OLD_BASELINE = [
    "# ── Detailed report for best baseline ───────────────────────\n",
    "best_clf = classifiers[best_clf_name]\n",
    "best_preds = best_clf.predict(X_te_tfidf)\n",
    "\n",
    "print(f'=== Classification Report: {best_clf_name} ===')\n",
    "print(classification_report(\n",
    "    y_te, best_preds,\n",
    "    target_names=label_encoder.classes_,\n",
    "    zero_division=0\n",
    "))",
]

NEW_BASELINE = [
    "# ── Detailed report for best baseline ───────────────────────\n",
    "best_clf   = classifiers[best_clf_name]\n",
    "best_preds = best_clf.predict(X_te_tfidf)\n",
    "\n",
    "print(f'=== Classification Report: {best_clf_name} ===')\n",
    "print(safe_report(y_te, best_preds))",
]

OLD_LSTM_TAIL = [
    "print(classification_report(\n",
    "    lstm_true, lstm_preds,\n",
    "    target_names=label_encoder.classes_,\n",
    "    zero_division=0\n",
    "))",
]

NEW_LSTM_TAIL = [
    "print(safe_report(lstm_true, lstm_preds))",
]

OLD_BERT_TAIL = [
    "print(classification_report(\n",
    "    bert_true, bert_preds,\n",
    "    target_names=label_encoder.classes_,\n",
    "    zero_division=0\n",
    "))",
]

NEW_BERT_TAIL = [
    "print(safe_report(bert_true, bert_preds))",
]


def source_text(cell):
    """Return the source as a single string for easy comparison."""
    return "".join(cell.get("source", []))


def patch_source(cell_source_list, old_lines, new_lines):
    """Replace old_lines (list of str) with new_lines inside a source list."""
    src = "".join(cell_source_list)
    old_str = "".join(old_lines)
    new_str = "".join(new_lines)
    if old_str in src:
        src = src.replace(old_str, new_str, 1)
        # Re-split into a list of lines with newlines preserved
        result = []
        for line in src.splitlines(keepends=True):
            result.append(line)
        # Ensure no trailing newline is lost on the last element
        if src.endswith("\n") and not result[-1].endswith("\n"):
            result[-1] += "\n"
        return result, True
    return cell_source_list, False


patched = {
    "helper_inserted": False,
    "baseline": False,
    "lstm": False,
    "bert": False,
}

helper_insert_after = None  # index of cell after which to insert helper cell

for idx, cell in enumerate(nb["cells"]):
    src = source_text(cell)

    # ── 1. Baseline cell ─────────────────────────────────────────────────────
    if not patched["baseline"] and "Detailed report for best baseline" in src:
        new_src, ok = patch_source(cell["source"], OLD_BASELINE, NEW_BASELINE)
        if ok:
            cell["source"] = new_src
            patched["baseline"] = True
            helper_insert_after = idx  # insert helper cell right before this cell
            print(f"  [OK] Patched baseline cell (index {idx})")

    # ── 2. LSTM test evaluation cell ──────────────────────────────────────────
    if not patched["lstm"] and "BiLSTM Test Accuracy" in src:
        new_src, ok = patch_source(cell["source"], OLD_LSTM_TAIL, NEW_LSTM_TAIL)
        if ok:
            cell["source"] = new_src
            patched["lstm"] = True
            print(f"  [OK] Patched LSTM report cell (index {idx})")

    # ── 3. DistilBERT test evaluation cell ────────────────────────────────────
    if not patched["bert"] and "DistilBERT Test Results" in src:
        new_src, ok = patch_source(cell["source"], OLD_BERT_TAIL, NEW_BERT_TAIL)
        if ok:
            cell["source"] = new_src
            patched["bert"] = True
            print(f"  [OK] Patched DistilBERT report cell (index {idx})")

# Insert the helper cell just before the baseline cell
if helper_insert_after is not None:
    nb["cells"].insert(helper_insert_after, HELPER_CELL)
    patched["helper_inserted"] = True
    print(f"  [OK] Inserted safe_report() helper cell before index {helper_insert_after}")

print("\nPatch summary:", patched)

if all(patched.values()):
    with open(NB_PATH, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=1, ensure_ascii=False)
    print("\n[OK] Notebook saved successfully!")
else:
    missing = [k for k, v in patched.items() if not v]
    print(f"\n[WARN] Some patches were NOT applied: {missing}")
    print("   The notebook was NOT saved to avoid corruption.")
