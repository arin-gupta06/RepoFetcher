import { promises as fs } from "node:fs";
import path from "node:path";
import { FeatureNormalizer } from "../cleaners/feature.normalizer";
import { DatasetFormatter } from "../cleaners/dataset.formatter";
import type { Repository } from "../models/repository.models";
import type { StructuralFingerprint } from "../models/structural-fingerprint.models";
import type { CleanedRepositorySample, InstructionTuningPair } from "../models/dataset.models";

const NON_PROGRAMMING_LANGUAGES = new Set([
  "unknown",
  "none",
  "",
  "html",
  "css",
  "scss",
  "dockerfile",
  "makefile",
  "jupyter notebook",
  "shell",
  "hcl",
  "cue",
]);

const NOISE_DIAGRAM_TYPES = new Set(["unknown", "noise", "ui_screenshot"]);

interface PruneStats {
  rawReposBefore: number;
  rawReposAfter: number;
  removedUnknownLanguage: number;
  removedEmptyReadme: number;
  removedBrokenUrlOrOwner: number;
  fingerprintsBefore: number;
  fingerprintsAfter: number;
  diagramsBefore: number;
  diagramsAfter: number;
  readmesBefore: number;
  readmesAfter: number;
  cleanedSamplesTotal: number;
}

export async function pruneDataset(): Promise<PruneStats> {
  console.log("=================================================");
  console.log("    RepoFetcher — Comprehensive Dataset Pruner   ");
  console.log("=================================================\n");

  const dataDir = path.resolve("data");
  const modelReadyDir = path.resolve("data/model_ready");

  const reposFile = path.join(dataDir, "repositories.jsonl");
  const readmesFile = path.join(dataDir, "readmes.jsonl");
  const fingerprintsFile = path.join(dataDir, "structural-fingerprints.jsonl");
  const archDocsFile = path.join(dataDir, "architecture-docs.jsonl");
  const diagramsFile = path.join(dataDir, "diagrams.jsonl");
  const checkpointFile = path.join(dataDir, "checkpoints.json");

  // -------------------------------------------------------------
  // 1. Read Raw Repositories
  // -------------------------------------------------------------
  console.log("📖 Reading raw repositories...");
  const rawReposContent = await fs.readFile(reposFile, "utf-8");
  const rawReposLines = rawReposContent.split("\n").filter((l) => l.trim().length > 0);
  const rawRepos: Repository[] = rawReposLines.map((l) => JSON.parse(l));

  const stats: PruneStats = {
    rawReposBefore: rawRepos.length,
    rawReposAfter: 0,
    removedUnknownLanguage: 0,
    removedEmptyReadme: 0,
    removedBrokenUrlOrOwner: 0,
    fingerprintsBefore: 0,
    fingerprintsAfter: 0,
    diagramsBefore: 0,
    diagramsAfter: 0,
    readmesBefore: 0,
    readmesAfter: 0,
    cleanedSamplesTotal: 0,
  };

  // -------------------------------------------------------------
  // 2. Filter Valid Repositories
  // -------------------------------------------------------------
  const validRepos: Repository[] = [];
  const validRepoIds = new Set<number>();
  const seenRepoSlugs = new Set<string>();

  for (const repo of rawRepos) {
    const slug = (repo.fullName || `${repo.owner?.login}/${repo.name}`).toLowerCase().trim();

    // Check slug uniqueness
    if (seenRepoSlugs.has(slug)) {
      continue;
    }

    // Check valid owner and repository URL
    const url = repo.url || "";
    const owner = repo.owner?.login || "";
    if (!url || !url.startsWith("http") || url.includes("unknown") || !owner || owner === "unknown") {
      stats.removedBrokenUrlOrOwner++;
      continue;
    }

    // Check valid programming language
    const lang = (repo.language || "").trim().toLowerCase();
    if (NON_PROGRAMMING_LANGUAGES.has(lang)) {
      stats.removedUnknownLanguage++;
      continue;
    }

    // Check README content substantiveness (at least 80 chars of substantive content)
    const readmeText = repo.readme?.content || "";
    const cleanReadme = readmeText
      .replace(/<[^>]+>/g, " ")
      .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanReadme.length < 80) {
      stats.removedEmptyReadme++;
      continue;
    }

    seenRepoSlugs.add(slug);
    validRepoIds.add(repo.id);
    validRepos.push(repo);
  }

  stats.rawReposAfter = validRepos.length;

  console.log(`✅ Valid repositories preserved: ${validRepos.length} (Purged: ${stats.rawReposBefore - stats.rawReposAfter})`);
  console.log(`   - Removed unknown/non-code languages: ${stats.removedUnknownLanguage}`);
  console.log(`   - Removed empty/stub READMEs:         ${stats.removedEmptyReadme}`);
  console.log(`   - Removed broken links / owners:      ${stats.removedBrokenUrlOrOwner}`);

  // -------------------------------------------------------------
  // 3. Prune Readmes
  // -------------------------------------------------------------
  console.log("\n📖 Pruning readmes.jsonl...");
  let validReadmes: any[] = [];
  try {
    const readmesContent = await fs.readFile(readmesFile, "utf-8");
    const readmeLines = readmesContent.split("\n").filter((l) => l.trim().length > 0);
    stats.readmesBefore = readmeLines.length;

    const seenReadmeRepoIds = new Set<number>();
    for (const line of readmeLines) {
      const r = JSON.parse(line);
      const repoId = r.repositoryId || r.id;
      if (validRepoIds.has(repoId) && !seenReadmeRepoIds.has(repoId)) {
        const prose = (r.content || "").replace(/\s+/g, " ").trim();
        if (prose.length >= 80) {
          seenReadmeRepoIds.add(repoId);
          validReadmes.push(r);
        }
      }
    }
    stats.readmesAfter = validReadmes.length;
    console.log(`✅ Preserved ${validReadmes.length} readmes (Purged: ${stats.readmesBefore - stats.readmesAfter})`);
  } catch {
    console.log("ℹ️ No readmes.jsonl found.");
  }

  // -------------------------------------------------------------
  // 4. Prune Structural Fingerprints
  // -------------------------------------------------------------
  console.log("\n📖 Pruning structural-fingerprints.jsonl...");
  const fingerprintsMap = new Map<number, StructuralFingerprint>();
  try {
    const fgContent = await fs.readFile(fingerprintsFile, "utf-8");
    const fgLines = fgContent.split("\n").filter((l) => l.trim().length > 0);
    stats.fingerprintsBefore = fgLines.length;

    for (const line of fgLines) {
      const fg: StructuralFingerprint = JSON.parse(line);
      if (validRepoIds.has(fg.repositoryId)) {
        fingerprintsMap.set(fg.repositoryId, fg);
      }
    }
    stats.fingerprintsAfter = fingerprintsMap.size;
    console.log(`✅ Preserved ${fingerprintsMap.size} fingerprints (Purged: ${stats.fingerprintsBefore - stats.fingerprintsAfter})`);
  } catch {
    console.log("ℹ️ No structural-fingerprints.jsonl found.");
  }

  // -------------------------------------------------------------
  // 5. Prune Diagrams (Remove noise, unknown types, or missing URLs)
  // -------------------------------------------------------------
  console.log("\n📖 Pruning diagrams.jsonl...");
  const validDiagrams: any[] = [];
  try {
    const diagContent = await fs.readFile(diagramsFile, "utf-8");
    const diagLines = diagContent.split("\n").filter((l) => l.trim().length > 0);
    stats.diagramsBefore = diagLines.length;

    for (const line of diagLines) {
      const d = JSON.parse(line);
      const repoId = d.repositoryId;
      if (!validRepoIds.has(repoId)) continue;

      const type = (d.diagramType || "").toLowerCase().trim();
      if (NOISE_DIAGRAM_TYPES.has(type)) continue;

      const url = d.originalUrl || d.uploadedAsset?.storageUrl || "";
      if (!url || !url.startsWith("http")) continue;

      validDiagrams.push(d);
    }
    stats.diagramsAfter = validDiagrams.length;
    console.log(`✅ Preserved ${validDiagrams.length} diagrams (Purged: ${stats.diagramsBefore - stats.diagramsAfter})`);
  } catch {
    console.log("ℹ️ No diagrams.jsonl found.");
  }

  // -------------------------------------------------------------
  // 6. Write Pruned Raw Storage Files
  // -------------------------------------------------------------
  console.log("\n💾 Rewriting pruned raw data files...");
  await writeJsonl(reposFile, validRepos);
  if (validReadmes.length > 0) {
    await writeJsonl(readmesFile, validReadmes);
  }
  if (fingerprintsMap.size > 0) {
    await writeJsonl(fingerprintsFile, Array.from(fingerprintsMap.values()));
  }
  if (validDiagrams.length > 0) {
    await writeJsonl(diagramsFile, validDiagrams);
  }

  // -------------------------------------------------------------
  // 7. Synchronize Checkpoints
  // -------------------------------------------------------------
  try {
    const cpContent = await fs.readFile(checkpointFile, "utf-8");
    const cpData = JSON.parse(cpContent);
    const existingIds: number[] = Array.isArray(cpData) ? cpData : cpData.processedIds || [];
    const prunedIds = existingIds.filter((id) => validRepoIds.has(id));
    const updatedCp = Array.isArray(cpData) ? prunedIds : { ...cpData, processedIds: prunedIds };
    await fs.writeFile(checkpointFile, JSON.stringify(updatedCp, null, 2), "utf-8");
    console.log(`✅ Checkpoints synchronized: ${prunedIds.length} active IDs tracked.`);
  } catch {
    // Checkpoint optional
  }

  // -------------------------------------------------------------
  // 8. Regenerate Model-Ready Datasets
  // -------------------------------------------------------------
  console.log("\n🧹 Normalizing and regenerating model-ready datasets...");
  const cleanedSamples: CleanedRepositorySample[] = validRepos.map((repo) => {
    const fg = fingerprintsMap.get(repo.id);
    return FeatureNormalizer.normalizeSample(repo, fg);
  });

  stats.cleanedSamplesTotal = cleanedSamples.length;

  console.log("🔄 Generating instruction-tuning pairs...");
  const allInstructionPairs: InstructionTuningPair[] = cleanedSamples.flatMap((sample) =>
    DatasetFormatter.toInstructionPairs(sample)
  );

  const classificationSamples = cleanedSamples.map((sample) =>
    DatasetFormatter.toClassificationSample(sample)
  );

  console.log("✂️  Creating 80/10/10 splits...");
  const instructionSplit = DatasetFormatter.createSplit(allInstructionPairs, 0.8, 0.1);
  const classificationSplit = DatasetFormatter.createSplit(classificationSamples, 0.8, 0.1);

  await fs.mkdir(modelReadyDir, { recursive: true });
  await writeJsonl(path.join(modelReadyDir, "instruction_tuning_train.jsonl"), instructionSplit.train);
  await writeJsonl(path.join(modelReadyDir, "instruction_tuning_val.jsonl"), instructionSplit.val);
  await writeJsonl(path.join(modelReadyDir, "instruction_tuning_test.jsonl"), instructionSplit.test);
  await fs.writeFile(
    path.join(modelReadyDir, "classification_dataset.json"),
    JSON.stringify(classificationSplit, null, 2),
    "utf-8"
  );
  await writeJsonl(path.join(modelReadyDir, "cleaned_repository_samples.jsonl"), cleanedSamples);

  const summary = {
    totalHarvestedRepos: validRepos.length,
    cleanedSamplesCount: cleanedSamples.length,
    totalInstructionPairs: allInstructionPairs.length,
    variantsPerSample: 6,
    splits: {
      trainCount: instructionSplit.metadata.trainCount,
      valCount: instructionSplit.metadata.valCount,
      testCount: instructionSplit.metadata.testCount,
    },
    architecturePatternsDistribution: countDistribution(cleanedSamples.map((s) => s.architecturePattern)),
    languageDistribution: countDistribution(cleanedSamples.map((s) => s.language)),
    frameworksDistribution: countDistribution(cleanedSamples.flatMap((s) => s.detectedFrameworks)),
    tierDistribution: countDistribution(cleanedSamples.map((s) => s.sourceTier)),
    pruneReport: stats,
    preparedAt: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(modelReadyDir, "dataset_summary.json"),
    JSON.stringify(summary, null, 2),
    "utf-8"
  );

  console.log("\n=================================================");
  console.log("       PRUNING & REGENERATION COMPLETE           ");
  console.log("=================================================");
  console.log(`Original Repos:      ${stats.rawReposBefore}`);
  console.log(`Clean Repos Kept:    ${stats.rawReposAfter}`);
  console.log(`Purged Bad/Unknown:  ${stats.rawReposBefore - stats.rawReposAfter}`);
  console.log(`Clean Diagrams:      ${stats.diagramsAfter}`);
  console.log(`Clean Instruction:   ${allInstructionPairs.length} pairs`);
  console.log("=================================================\n");

  return stats;
}

async function writeJsonl(filePath: string, records: any[]): Promise<void> {
  const content = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await fs.writeFile(filePath, content, "utf-8");
}

function countDistribution(items: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (!item) continue;
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a)
  );
}

// Run directly if invoked as script
if (process.argv[1]?.includes("prune-dataset")) {
  pruneDataset().catch((err) => {
    console.error("❌ Pruning failed:", err);
    process.exit(1);
  });
}
