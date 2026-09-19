import { promises as fs } from "node:fs";
import path from "node:path";
import { FeatureNormalizer } from "../cleaners/feature.normalizer";
import { DatasetFormatter } from "../cleaners/dataset.formatter";
import { CURATED_REFERENCE_REPOSITORIES, TIER_1_CANONICAL_TEMPLATES } from "../constants/curated-sources.constants";
import type { Repository } from "../models/repository.models";
import type { StructuralFingerprint } from "../models/structural-fingerprint.models";
import type { CleanedRepositorySample, InstructionTuningPair } from "../models/dataset.models";

async function runDatasetCleaningPipeline() {
  console.log("=================================================");
  console.log("  RepoFetcher - ML Dataset Preparation Pipeline  ");
  console.log("=================================================\n");

  const dataDir = path.resolve("data");
  const outputDir = path.resolve("data/model_ready");

  await fs.mkdir(outputDir, { recursive: true });

  const rawReposFile = path.join(dataDir, "repositories.jsonl");
  const rawFingerprintsFile = path.join(dataDir, "structural-fingerprints.jsonl");

  let rawRepos: Repository[] = [];
  const fingerprintsMap = new Map<number, StructuralFingerprint>();

  // 1. Read existing raw harvested data if available
  try {
    const reposContent = await fs.readFile(rawReposFile, "utf-8");
    const lines = reposContent.split("\n").filter((l) => l.trim().length > 0);
    rawRepos = lines.map((l) => JSON.parse(l));
    console.log(`[Cleaner] Loaded ${rawRepos.length} raw repository records from ${rawReposFile}`);

    try {
      const fgContent = await fs.readFile(rawFingerprintsFile, "utf-8");
      const fgLines = fgContent.split("\n").filter((l) => l.trim().length > 0);
      for (const line of fgLines) {
        const fg: StructuralFingerprint = JSON.parse(line);
        fingerprintsMap.set(fg.repositoryId, fg);
      }
      console.log(`[Cleaner] Loaded ${fingerprintsMap.size} structural fingerprints.`);
    } catch {
      console.log("[Cleaner] No structural fingerprints file found; proceeding with repo metadata only.");
    }
  } catch {
    console.log("ℹ️ Raw harvested dataset not found. Generating seed dataset from curated reference repositories...\n");

    // Build seed dataset from all curated reference repositories
    CURATED_REFERENCE_REPOSITORIES.forEach((seed, idx) => {
      const id = 1000 + idx;
      const lang = seed.language ?? "TypeScript";
      const framework = detectFrameworkFromPattern(seed.architecturePattern, lang);
      const layers = buildLayersFromPattern(seed.architecturePattern);

      rawRepos.push({
        id,
        name: seed.repo,
        fullName: `${seed.owner}/${seed.repo}`,
        description: `Production-grade implementation of ${seed.architecturePattern} using ${lang}`,
        url: `https://github.com/${seed.owner}/${seed.repo}`,
        stars: Math.round(20000 * Math.exp(-idx * 0.04)),
        forks: Math.round(5000 * Math.exp(-idx * 0.04)),
        language: lang,
        defaultBranch: "main",
        owner: {
          login: seed.owner,
          avatarUrl: `https://github.com/${seed.owner}.png`,
          profileUrl: `https://github.com/${seed.owner}`,
        },
        source: "curated",
        sourceTier: seed.tier,
        topics: buildTopicsFromPattern(seed.architecturePattern),
        createdAt: "2022-01-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
        readme: {
          content: buildReadme(seed.repo, seed.architecturePattern, lang, framework),
        },
      });

      fingerprintsMap.set(id, buildFingerprint(id, `${seed.owner}/${seed.repo}`, layers, framework));
    });

    // Add Tier 1 Canonical Templates as synthetic samples
    TIER_1_CANONICAL_TEMPLATES.forEach((template, idx) => {
      const id = 2000 + idx;
      const layers = buildLayersFromPattern(template.pattern);
      const framework = detectFrameworkFromPattern(template.pattern, "TypeScript");

      rawRepos.push({
        id,
        name: `canonical-template-${idx + 1}`,
        fullName: `canonical-templates/template-${idx + 1}`,
        description: template.pattern,
        url: `https://github.com/canonical-templates/template-${idx + 1}`,
        stars: 30000,
        forks: 8000,
        language: "TypeScript",
        defaultBranch: "main",
        owner: {
          login: "canonical-templates",
          avatarUrl: "https://github.com/canonical-templates.png",
          profileUrl: "https://github.com/canonical-templates",
        },
        source: "curated",
        sourceTier: "tier_1_template",
        topics: buildTopicsFromPattern(template.pattern),
        createdAt: "2021-01-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
        readme: {
          content: buildReadme(`canonical-template-${idx + 1}`, template.pattern, "TypeScript", framework),
        },
      });

      fingerprintsMap.set(id, buildFingerprint(id, `canonical-templates/template-${idx + 1}`, layers, framework));
    });
  }

  console.log(`📦 Total raw repositories to process: ${rawRepos.length}`);

  const NON_CODE = new Set([
    "unknown", "none", "", "html", "css", "scss", "dockerfile", "makefile", "jupyter notebook", "shell", "hcl", "cue"
  ]);

  const filteredRepos = rawRepos.filter((repo) => {
    const lang = (repo.language || "").trim().toLowerCase();
    if (NON_CODE.has(lang)) return false;
    const url = repo.url || "";
    const owner = repo.owner?.login || "";
    if (!url.startsWith("http") || url.includes("unknown") || !owner || owner === "unknown") return false;
    const cleanReadme = (repo.readme?.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return cleanReadme.length >= 80;
  });

  console.log(`🧹 Retained ${filteredRepos.length} high-hygiene repositories for modeling.`);

  // 2. Normalize and clean samples
  console.log("\n🧹 Cleaning text and normalizing features...");
  const cleanedSamples: CleanedRepositorySample[] = filteredRepos.map((repo) => {
    const fg = fingerprintsMap.get(repo.id);
    return FeatureNormalizer.normalizeSample(repo, fg);
  });

  // 3. Generate all instruction-tuning pairs (6 variants per repo)
  console.log("🔄 Generating instruction-tuning pairs (6 variants per repo)...");
  const allInstructionPairs: InstructionTuningPair[] = cleanedSamples.flatMap((sample) =>
    DatasetFormatter.toInstructionPairs(sample)
  );

  // 4. Generate classification samples
  const classificationSamples = cleanedSamples.map((sample) =>
    DatasetFormatter.toClassificationSample(sample)
  );

  // 5. Create Train / Val / Test splits
  console.log("✂️  Creating 80/10/10 Train/Val/Test splits...");
  const instructionSplit = DatasetFormatter.createSplit(allInstructionPairs, 0.8, 0.1);
  const classificationSplit = DatasetFormatter.createSplit(classificationSamples, 0.8, 0.1);

  // 6. Save dataset files
  console.log("💾 Writing dataset files to data/model_ready/...");

  await writeJsonl(path.join(outputDir, "instruction_tuning_train.jsonl"), instructionSplit.train);
  await writeJsonl(path.join(outputDir, "instruction_tuning_val.jsonl"), instructionSplit.val);
  await writeJsonl(path.join(outputDir, "instruction_tuning_test.jsonl"), instructionSplit.test);

  await fs.writeFile(
    path.join(outputDir, "classification_dataset.json"),
    JSON.stringify(classificationSplit, null, 2),
    "utf-8"
  );

  await writeJsonl(path.join(outputDir, "cleaned_repository_samples.jsonl"), cleanedSamples);

  // Output Dataset Summary
  const summary = {
    totalHarvestedRepos: rawRepos.length,
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
    preparedAt: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(outputDir, "dataset_summary.json"),
    JSON.stringify(summary, null, 2),
    "utf-8"
  );

  console.log("\n✅ ML Dataset Preparation Complete!");
  console.log(`📊 Repository Samples: ${cleanedSamples.length}`);
  console.log(`📝 Total Instruction Pairs: ${allInstructionPairs.length} (${cleanedSamples.length} repos × 6 variants)`);
  console.log(`   - Train: ${instructionSplit.metadata.trainCount}`);
  console.log(`   - Val:   ${instructionSplit.metadata.valCount}`);
  console.log(`   - Test:  ${instructionSplit.metadata.testCount}`);
  console.log(`\n📁 Files exported to ${outputDir}:`);
  console.log("   - instruction_tuning_train.jsonl");
  console.log("   - instruction_tuning_val.jsonl");
  console.log("   - instruction_tuning_test.jsonl");
  console.log("   - classification_dataset.json");
  console.log("   - cleaned_repository_samples.jsonl");
  console.log("   - dataset_summary.json");
}

// ---------------------------------------------------------------------------
// Seed data helpers
// ---------------------------------------------------------------------------

function detectFrameworkFromPattern(pattern: string, lang: string): string {
  const p = pattern.toLowerCase();
  if (p.includes("nestjs") || p.includes("modular") && lang === "TypeScript") return "NestJS";
  if (p.includes("fastapi")) return "FastAPI";
  if (p.includes("spring")) return "Spring Boot";
  if (p.includes("gin") || p.includes("go") && p.includes("http")) return "Gin";
  if (p.includes("django")) return "Django";
  if (p.includes("express") || p.includes("node")) return "Express";
  if (p.includes("actix") || p.includes("axum")) return "Actix-web";
  if (p.includes("flask")) return "Flask";
  if (p.includes("graphql")) return "Apollo Server";
  if (lang === "TypeScript" || lang === "JavaScript") return "Express";
  if (lang === "Python") return "FastAPI";
  if (lang === "Java") return "Spring Boot";
  if (lang === "Go") return "Gin";
  if (lang === "Rust") return "Axum";
  return "";
}

function buildLayersFromPattern(pattern: string): string[] {
  const p = pattern.toLowerCase();
  const base = ["controllers", "services", "models"];
  if (p.includes("clean") || p.includes("hexagonal") || p.includes("onion")) {
    return ["controllers", "services", "repositories", "models", "infrastructure", "middleware"];
  }
  if (p.includes("microservice") || p.includes("ddd")) {
    return ["controllers", "services", "repositories", "models", "infrastructure"];
  }
  if (p.includes("cqrs")) {
    return ["controllers", "services", "repositories", "models"];
  }
  if (p.includes("event")) {
    return ["services", "models", "infrastructure"];
  }
  return base;
}

function buildTopicsFromPattern(pattern: string): string[] {
  const p = pattern.toLowerCase();
  const topics: string[] = ["architecture", "clean-code"];
  if (p.includes("microservice")) topics.push("microservices");
  if (p.includes("ddd")) topics.push("domain-driven-design", "ddd");
  if (p.includes("cqrs")) topics.push("cqrs", "event-sourcing");
  if (p.includes("clean") || p.includes("hexagonal")) topics.push("clean-architecture");
  if (p.includes("event")) topics.push("event-driven");
  if (p.includes("graphql")) topics.push("graphql");
  if (p.includes("serverless")) topics.push("serverless");
  if (p.includes("rest")) topics.push("rest-api");
  topics.push("best-practices");
  return topics;
}

function buildReadme(repoName: string, pattern: string, lang: string, framework: string): string {
  return `# ${repoName}

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#) [![Stars](https://img.shields.io/github/stars/${repoName}?style=social)](#)

## Overview

Production-grade implementation demonstrating **${pattern}** using ${lang}${framework ? ` and ${framework}` : ""}.

This repository serves as a reference architecture for building scalable, maintainable, and testable applications following ${pattern} principles.

## Architecture

The project follows the **${pattern}** pattern with strict layer separation:

- **Controllers / API Layer**: Handles incoming HTTP requests and routes them to the appropriate service
- **Service Layer**: Encapsulates core business logic and orchestration
- **Repository / Data Access Layer**: Abstracts persistence concerns from business logic
- **Domain / Model Layer**: Contains core entities, value objects, and domain logic
- **Infrastructure Layer**: External adapters — databases, queues, external APIs

## Technology Stack

- **Language**: ${lang}
- **Framework**: ${framework || "Vanilla " + lang}
- **Architecture Pattern**: ${pattern}

## Getting Started

\`\`\`bash
git clone this repository
npm install  # or equivalent for your language
npm run dev
\`\`\`

## Project Structure

\`\`\`
src/
├── controllers/    # API request handlers
├── services/       # Business logic layer
├── repositories/   # Data access layer
├── models/         # Domain entities and DTOs
└── infrastructure/ # External adapters & configuration
\`\`\`

## Design Decisions

- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Inversion**: Higher-level modules do not depend on lower-level modules
- **Testability**: All layers are independently testable with mocked dependencies

## Contributing

Pull requests are welcome. Please follow the existing architectural conventions.
`;
}

function buildFingerprint(
  id: number,
  fullName: string,
  layers: string[],
  framework: string
): StructuralFingerprint {
  return {
    repositoryId: id,
    repositoryFullName: fullName,
    defaultBranch: "main",
    entryPoints: ["src/index.ts", "src/main.ts"].slice(0, 1),
    manifests: framework
      ? [
          {
            filename: "package.json",
            frameworkDetected: [framework],
            dependencies: { [framework.toLowerCase().replace(" ", "-")]: "^latest" },
            devDependencies: {},
          },
        ]
      : [],
    detectedLayers: layers.map((layer) => ({
      layerName: layer,
      matchPaths: [`src/${layer}/sample.file.ts`],
    })),
    totalFiles: 30 + Math.floor(layers.length * 12),
    totalDirectories: 8 + layers.length,
    collectedAt: new Date(),
  };
}

async function writeJsonl<T>(filePath: string, records: T[]): Promise<void> {
  const content = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await fs.writeFile(filePath, content, "utf-8");
}

function countDistribution(items: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a)
  );
}

runDatasetCleaningPipeline().catch((err) => {
  console.error("❌ Dataset preparation failed:", err);
  process.exit(1);
});
