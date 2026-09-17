import { octokit } from "../../config/github";
import type { Repository } from "../../models/repository.models";
import type { SourceTier } from "../../services/assets/asset.interface";
import { collectionStatistics } from "../../statistics/collection.statistics";
import { mapGitHubRepository } from "./github.mapper";
import {
  buildPagedSearchQuery,
  buildRepositorySearchQuery,
  githubRepositorySearchOptions,
  githubSearchOptions,
  STAR_BRACKETS,
} from "./github.query";

export async function collectGitHubRepositories(
  language: string,
): Promise<Repository[]> {
  const response = await octokit.search.repos({
    q: buildRepositorySearchQuery(language),
    ...githubRepositorySearchOptions,
  });

  collectionStatistics.incrementRepositories(response.data.items.length);

  return response.data.items.map((repo) => mapGitHubRepository(repo));
}

export async function collectGitHubRepositoriesPaged(
  language: string,
  maxPages = 2
): Promise<Repository[]> {
  const allRepos: Repository[] = [];
  const seenIds = new Set<number>();

  for (const bracket of STAR_BRACKETS) {
    const q = buildPagedSearchQuery(language, bracket);

    for (let page = 1; page <= maxPages; page++) {
      try {
        const response = await octokit.search.repos({
          q,
          page,
          ...githubSearchOptions,
        });

        const items = response.data.items ?? [];
        if (items.length === 0) break;

        for (const item of items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allRepos.push(mapGitHubRepository(item, "tier_4_public_pool"));
          }
        }

        collectionStatistics.incrementRepositories(items.length);

        // Respect GitHub Search API rate limits (30 req/min)
        await delay(2000);
      } catch (error: any) {
        if (error.status === 403) {
          console.warn("[GitHub Collector] Rate limit reached. Sleeping for 30s...");
          await delay(30000);
          break;
        }
        break;
      }
    }
  }

  return allRepos;
}

export async function fetchSingleRepository(
  owner: string,
  repo: string,
  tier: SourceTier
): Promise<Repository | null> {
  try {
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return mapGitHubRepository(data as any, tier);
  } catch {
    return null;
  }
}

export async function collectGitHubRepositoriesByTopic(
  topic: string,
  maxPages = 3
): Promise<Repository[]> {
  const allRepos: Repository[] = [];
  const seenIds = new Set<number>();

  // Strip "topic:" prefix for the search query
  const topicQuery = `${topic} stars:>200`;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const response = await octokit.search.repos({
        q: topicQuery,
        page,
        ...githubSearchOptions,
      });

      const items = response.data.items ?? [];
      if (items.length === 0) break;

        const cleanTopic = topic.replace(/^topic:/, "").toLowerCase();
        for (const item of items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            const mappedRepo = mapGitHubRepository(item, "tier_3_verified_oss");
            if (!mappedRepo.topics) mappedRepo.topics = [];
            if (!mappedRepo.topics.includes(cleanTopic)) {
              mappedRepo.topics.push(cleanTopic);
            }
            allRepos.push(mappedRepo);
          }
        }

      collectionStatistics.incrementRepositories(items.length);
      await delay(2000);
    } catch (error: any) {
      if (error.status === 403) {
        console.warn("[GitHub Collector] Rate limit reached on topic search. Sleeping for 30s...");
        await delay(30000);
        break;
      }
      break;
    }
  }

  return allRepos;
}

export async function collectGitHubRepositoriesByTopicAndLanguage(
  topic: string,
  language: string,
  maxPages = 2
): Promise<Repository[]> {
  const allRepos: Repository[] = [];
  const seenIds = new Set<number>();
  const topicQuery = `${topic} language:${language} stars:>100`;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const response = await octokit.search.repos({
        q: topicQuery,
        page,
        ...githubSearchOptions,
      });

      const items = response.data.items ?? [];
      if (items.length === 0) break;

      const cleanTopic = topic.replace(/^topic:/, "").toLowerCase();
      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          const mappedRepo = mapGitHubRepository(item, "tier_3_verified_oss");
          if (!mappedRepo.topics) mappedRepo.topics = [];
          if (!mappedRepo.topics.includes(cleanTopic)) {
            mappedRepo.topics.push(cleanTopic);
          }
          allRepos.push(mappedRepo);
        }
      }

      collectionStatistics.incrementRepositories(items.length);
      await delay(2000);
    } catch (error: any) {
      if (error.status === 403) {
        console.warn(`[GitHub Collector] Rate limit on ${topic} (${language}). Sleeping 30s...`);
        await delay(30000);
        break;
      }
      break;
    }
  }

  return allRepos;
}

export async function collectGitHubRepositoriesByCustomQuery(
  query: string,
  maxPages = 3,
  tier: SourceTier = "tier_3_verified_oss"
): Promise<Repository[]> {
  const allRepos: Repository[] = [];
  const seenIds = new Set<number>();

  for (let page = 1; page <= maxPages; page++) {
    try {
      const response = await octokit.search.repos({
        q: query,
        page,
        ...githubSearchOptions,
      });

      const items = response.data.items ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allRepos.push(mapGitHubRepository(item, tier));
        }
      }

      collectionStatistics.incrementRepositories(items.length);
      await delay(2000);
    } catch (error: any) {
      if (error.status === 403) {
        console.warn(`[GitHub Collector] Rate limit reached on query: "${query}". Sleeping 30s...`);
        await delay(30000);
        break;
      }
      break;
    }
  }

  return allRepos;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

