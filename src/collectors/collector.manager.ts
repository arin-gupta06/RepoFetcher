import { languages } from "../constants/languages.constants";
import {
  CURATED_REFERENCE_REPOSITORIES,
} from "../constants/curated-sources.constants";
import { ARCHITECTURE_TOPICS } from "./github/github.query";
import type { Repository } from "../models/repository.models";
import type { CollectionResult } from "../models/collection-result.models";

import { collectRepositoryReadme } from "./assets/readme.collector";
import { collectRepositoryArchitectureDocs } from "./assets/architecture-doc.collector";
import { collectRepositoryFingerprint } from "./assets/tree.collector";
import { collectRepositoryManifests } from "./assets/manifest.collector";
import { collectRepositoryDiagrams } from "./assets/diagram.collector";
import { collectRepositoryImages } from "./assets/image.collector";

import {
  collectGitHubRepositoriesPaged,
  collectGitHubRepositoriesByTopic,
  collectGitHubRepositoriesByTopicAndLanguage,
  collectGitHubRepositoriesByCustomQuery,
  collectGitHubRepositories,
  fetchSingleRepository,
} from "./github/github.collector";
import { collectRepositoriesViaAuthenticatedWebSearch } from "./web/web-search.collector";
import { collectKaggleDatasets } from "./kaggle/kaggle.collector";
import { CheckpointStore } from "../storage/checkpoint.store";
import { appendJsonl } from "../storage/json.exporter";
import { SkewnessAnalyzer } from "./adaptive/skewness-analyzer";
import { AdaptiveQueryGenerator } from "./adaptive/adaptive-query-generator";
import { EvidenceValidator } from "./adaptive/evidence-validator";
import { ADAPTIVE_CONFIG, VALID_PROGRAMMING_LANGUAGES } from "./adaptive/adaptive.config";
import { promises as fs } from "node:fs";
import path from "node:path";

const NON_PROGRAMMING_LANGUAGES = new Set([
  "unknown", "none", "", "html", "css", "scss", "dockerfile", "makefile", "jupyter notebook", "shell", "hcl", "cue"
]);

let cachedSaturatedLangs: Set<string> | null = null;
let lastSaturationCheck = 0;

export async function getSaturatedLanguages(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedSaturatedLangs && now - lastSaturationCheck < 30000) {
    return cachedSaturatedLangs;
  }
  const saturated = new Set<string>();
  try {
    const summaryPath = path.resolve("data/model_ready/dataset_summary.json");
    const raw = await fs.readFile(summaryPath, "utf-8");
    const summary = JSON.parse(raw);
    const langDist: Record<string, number> = summary.languageDistribution || {};
    const total = summary.totalHarvestedRepos || summary.cleanedSamplesCount || 1;
    const K = Math.max(1, Object.keys(langDist).length);
    const targetShare = 1.0 / K;
    const saturationShare = targetShare * ADAPTIVE_CONFIG.SATURATION_SHARE_RATIO;

    for (const [lang, count] of Object.entries(langDist)) {
      const share = count / total;
      if (share >= saturationShare) {
        saturated.add(lang.toLowerCase());
      }
    }
  } catch {
    saturated.add("javascript");
  }
  cachedSaturatedLangs = saturated;
  lastSaturationCheck = now;
  return saturated;
}

const checkpoint = new CheckpointStore();

export async function runHarvestingPipeline(): Promise<void> {
  await checkpoint.load();
  console.log(`[RepoFetcher] Checkpoint loaded. ${checkpoint.getProcessedCount()} repos already processed.`);

  // -------------------------------------------------------------
  // Step 1: Ingest Tier 2 & Tier 3 Curated Repositories
  // -------------------------------------------------------------
  console.log("\n🚀 Ingesting Tier 2 & Tier 3 Curated Repositories...");
  for (const curated of CURATED_REFERENCE_REPOSITORIES) {
    const repo = await fetchSingleRepository(curated.owner, curated.repo, curated.tier);
    if (repo && !checkpoint.has(repo.id)) {
      await processAndStreamRepository(repo);
      await checkpoint.markProcessed(repo.id);
    }
  }

  // -------------------------------------------------------------
  // Step 2: Ingest Architecture Topic Repositories (Tier 3 - High Priority for Diversity)
  // -------------------------------------------------------------
  console.log("\n🏗 Ingesting Architecture Topic Repositories (Targeted Architectural Classes)...");
  for (const topic of ARCHITECTURE_TOPICS) {
    console.log(`\n🔎 Searching topic: ${topic}`);
    const repos = await collectGitHubRepositoriesByTopic(topic, 3);

    for (const repo of repos) {
      if (checkpoint.has(repo.id)) continue;
      await processAndStreamRepository(repo);
      await checkpoint.markProcessed(repo.id);
    }
  }

  // Cross-sample key architectural topics across varied programming languages
  const keyTopics = [
    "topic:clean-architecture",
    "topic:hexagonal-architecture",
    "topic:microservices",
    "topic:domain-driven-design",
    "topic:event-driven",
    "topic:cqrs",
  ];
  const targetLanguages = ["Python", "Go", "Java", "C#", "Rust", "Typescript"];

  console.log("\n🌐 Cross-Sampling Architecture Topics across Diverse Languages...");
  for (const topic of keyTopics) {
    for (const lang of targetLanguages) {
      console.log(`   🔎 Querying ${topic} in ${lang}...`);
      const repos = await collectGitHubRepositoriesByTopicAndLanguage(topic, lang, 2);
      for (const repo of repos) {
        if (checkpoint.has(repo.id)) continue;
        await processAndStreamRepository(repo);
        await checkpoint.markProcessed(repo.id);
      }
    }
  }

  // -------------------------------------------------------------
  // Step 3: Ingest Authenticated Web Search Repositories (Tier 3)
  // -------------------------------------------------------------
  console.log("\n🌐 Ingesting Discovered Repositories via Authenticated Web Search...");
  const webRepos = await collectRepositoriesViaAuthenticatedWebSearch();
  for (const repo of webRepos) {
    if (checkpoint.has(repo.id)) continue;
    await processAndStreamRepository(repo);
    await checkpoint.markProcessed(repo.id);
  }

  // -------------------------------------------------------------
  // Step 4: Ingest Scaled GitHub Sliced Repositories (Balanced Minority Sample Only)
  // -------------------------------------------------------------
  console.log("\n🌐 Ingesting Sliced GitHub Candidate Pool by Language (Minority Categories Only)...");
  const saturatedLangs = await getSaturatedLanguages();
  for (const lang of languages) {
    if (saturatedLangs.has(lang.toLowerCase())) {
      console.log(`   ⏸ [Saturation Stopped] Skipping language '${lang}' (content share quota reached).`);
      continue;
    }
    console.log(`\n🔍 Searching minority language: ${lang}`);
    const repos = await collectGitHubRepositoriesPaged(lang, 1);

    for (const repo of repos) {
      if (checkpoint.has(repo.id)) continue;
      await processAndStreamRepository(repo);
      await checkpoint.markProcessed(repo.id);
    }
  }
}

export async function runAdaptiveHarvestingPipeline(options?: {
  maxQueries?: number;
  maxReposPerBatch?: number;
}): Promise<void> {
  await checkpoint.load();
  console.log(`\n🧠 [Adaptive Fetcher] Evaluating dataset skewness...`);

  const report = await SkewnessAnalyzer.analyzeFromSummary();
  console.log(`📊 Current Symmetry Score: ${report.symmetryScore}%`);
  console.log(`   Language Entropy:     ${report.metrics.languageEntropy} (Gini-Simpson: ${report.metrics.languageGiniSimpson})`);
  console.log(`   Architecture Entropy: ${report.metrics.architectureEntropy} (Gini-Simpson: ${report.metrics.architectureGiniSimpson})`);
  console.log(`   Starved Languages:    ${report.starvedCategories.languages.length}`);
  console.log(`   Starved Architectures: ${report.starvedCategories.architectures.length}`);

  const maxRepos = options?.maxReposPerBatch ?? 50;
  const harvestPlan = AdaptiveQueryGenerator.generateHarvestPlan(
    report,
    options?.maxQueries ?? 20,
    maxRepos
  );

  console.log(`\n🎯 Generated ${harvestPlan.length} Tiered Water-Filling harvest queries.`);

  let newlyIngested = 0;

  for (const item of harvestPlan) {
    if (newlyIngested >= maxRepos) {
      console.log(`\n⏹ Batch limit of ${maxRepos} repos reached for this cycle.`);
      break;
    }

    console.log(`\n🔍 [${item.tierName}] Quota: ${item.targetQuota} repos (Priority: ${item.priorityScore})`);
    console.log(`   Query: "${item.query}" (maxPages: ${item.maxPages})`);
    console.log(`   Rationale: ${item.rationale}`);

    const repos = await collectGitHubRepositoriesByCustomQuery(item.query, item.maxPages);
    console.log(`   -> Discovered ${repos.length} candidates.`);

    let queryIngested = 0;

    for (const repo of repos) {
      if (checkpoint.has(repo.id)) continue;
      if (queryIngested >= item.targetQuota) {
        console.log(`   -> Target Water-Filling quota (${item.targetQuota}) reached for this query.`);
        break;
      }

      const accepted = await processAndStreamRepository(repo);
      await checkpoint.markProcessed(repo.id);

      if (accepted) {
        newlyIngested++;
        queryIngested++;
      }

      if (newlyIngested >= maxRepos) break;
    }
  }

  console.log(`\n✅ Adaptive harvest cycle completed: ${newlyIngested} verified repositories ingested.`);
}

export async function processAndStreamRepository(repository: Repository): Promise<boolean> {
  const langLower = (repository.language || "").trim().toLowerCase();

  // 1. Hygiene Gate: Reject non-code, unknown, or empty languages
  if (!langLower || NON_PROGRAMMING_LANGUAGES.has(langLower)) {
    console.log(`   ⚠️ [Hygiene Gate REJECTED] ${repository.fullName}: Invalid or unknown language '${repository.language}'.`);
    return false;
  }

  // 2. Saturation Gate: Reject if category has reached saturation content share
  const saturated = await getSaturatedLanguages();
  if (saturated.has(langLower)) {
    console.log(`   ⚠️ [Saturation Gate REJECTED] ${repository.fullName}: Language '${repository.language}' has reached saturation content share. Paused to harvest minorities.`);
    return false;
  }

  console.log(`📦 Processing minority candidate ${repository.fullName} (${repository.sourceTier})...`);

  // 3. Readme
  const readme = await collectRepositoryReadme(repository);
  if (readme) {
    repository.readme = readme;
  }

  // 2. Architecture Docs
  const archDocs = await collectRepositoryArchitectureDocs(repository);
  repository.architectureDocs = archDocs;

  // 3. Manifests & Frameworks
  const manifests = await collectRepositoryManifests(
    repository.owner.login,
    repository.name,
    repository.defaultBranch
  );

  // 4. File Tree & Layer Layout
  const fingerprint = await collectRepositoryFingerprint(repository);
  if (fingerprint) {
    fingerprint.manifests = manifests;
    repository.fingerprint = fingerprint;
  }

  // 5. Architecture Evidence Safety Gate Validation
  const validation = EvidenceValidator.validateRepository(repository);
  if (!validation.isValid) {
    console.log(`   ⚠️ [Evidence Gate REJECTED] ${repository.fullName} (Score: ${validation.evidenceScore}): ${validation.rejectionReason}`);
    return false;
  }

  console.log(`   ✅ [Evidence Gate PASSED] Score: ${validation.evidenceScore} | ${validation.signals.join(" • ")}`);

  // 6. Persist Verified Assets
  if (readme) {
    await appendJsonl(readme, "data/readmes.jsonl");
  }

  if (archDocs && archDocs.length > 0) {
    for (const doc of archDocs) {
      await appendJsonl(doc, "data/architecture-docs.jsonl");
    }
  }

  if (fingerprint) {
    await appendJsonl(fingerprint, "data/structural-fingerprints.jsonl");
  }

  // 7. Diagrams with Context & pHash
  await collectRepositoryDiagrams(repository);
  if (repository.diagrams && repository.diagrams.length > 0) {
    for (const diag of repository.diagrams) {
      await appendJsonl(
        { repositoryId: repository.id, ...diag },
        "data/diagrams.jsonl"
      );
    }
  }

  // 8. Master Repository Record
  await appendJsonl(repository, "data/repositories.jsonl");
  return true;
}

export async function collectResources(): Promise<CollectionResult> {
  const repositories: Repository[] = [];
  const datasets = await collectKaggleDatasets();
  const readmes = [];

  for (const language of languages) {
    const githubRepositories = await collectGitHubRepositories(language);
    repositories.push(...githubRepositories);
  }

  for (const repository of repositories) {
    const readme = await collectRepositoryReadme(repository);
    if (readme) {
      repository.readme = readme;
      readmes.push(readme);
      await collectRepositoryDiagrams(repository);
      await collectRepositoryImages(repository);
    }
  }

  return {
    repositories,
    datasets,
    readmes,
  };
}
