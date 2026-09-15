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
  collectGitHubRepositories,
  fetchSingleRepository,
} from "./github/github.collector";
import { collectKaggleDatasets } from "./kaggle/kaggle.collector";
import { CheckpointStore } from "../storage/checkpoint.store";
import { appendJsonl } from "../storage/json.exporter";

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
  // Step 2: Ingest Scaled GitHub Sliced Repositories (Tier 4)
  // -------------------------------------------------------------
  console.log("\n🌐 Ingesting Sliced GitHub Candidate Pool by Language...");
  for (const lang of languages) {
    console.log(`\n🔍 Searching language: ${lang}`);
    const repos = await collectGitHubRepositoriesPaged(lang, 5);

    for (const repo of repos) {
      if (checkpoint.has(repo.id)) continue;
      await processAndStreamRepository(repo);
      await checkpoint.markProcessed(repo.id);
    }
  }

  // -------------------------------------------------------------
  // Step 3: Ingest Architecture Topic Repositories (Tier 3)
  // -------------------------------------------------------------
  console.log("\n🏗 Ingesting Architecture Topic Repositories...");
  for (const topic of ARCHITECTURE_TOPICS) {
    console.log(`\n🔎 Searching topic: ${topic}`);
    const repos = await collectGitHubRepositoriesByTopic(topic);

    for (const repo of repos) {
      if (checkpoint.has(repo.id)) continue;
      await processAndStreamRepository(repo);
      await checkpoint.markProcessed(repo.id);
    }
  }
}

export async function processAndStreamRepository(repository: Repository): Promise<void> {
  console.log(`📦 Processing ${repository.fullName} (${repository.sourceTier})...`);

  // 1. Readme
  const readme = await collectRepositoryReadme(repository);
  if (readme) {
    repository.readme = readme;
    await appendJsonl(readme, "data/readmes.jsonl");
  }

  // 2. Architecture Docs
  const archDocs = await collectRepositoryArchitectureDocs(repository);
  repository.architectureDocs = archDocs;
  for (const doc of archDocs) {
    await appendJsonl(doc, "data/architecture-docs.jsonl");
  }

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
    await appendJsonl(fingerprint, "data/structural-fingerprints.jsonl");
  }

  // 5. Diagrams with Context & pHash
  await collectRepositoryDiagrams(repository);
  if (repository.diagrams && repository.diagrams.length > 0) {
    for (const diag of repository.diagrams) {
      await appendJsonl(
        { repositoryId: repository.id, ...diag },
        "data/diagrams.jsonl"
      );
    }
  }

  // 6. Master Repository Record
  await appendJsonl(repository, "data/repositories.jsonl");
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
