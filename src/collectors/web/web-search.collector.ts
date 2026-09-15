import dotenv from "dotenv";
import type { Repository } from "../../models/repository.models";
import { fetchSingleRepository } from "../github/github.collector";
import { collectionStatistics } from "../../statistics/collection.statistics";

dotenv.config();

export interface WebSearchQuery {
  query: string;
  topic: string;
}

export const ARCHITECTURAL_WEB_SEARCH_QUERIES: WebSearchQuery[] = [
  { query: "clean architecture reference repository site:github.com", topic: "clean-architecture" },
  { query: "hexagonal architecture domain driven design site:github.com", topic: "hexagonal-architecture" },
  { query: "event driven architecture kafka rabbitmq site:github.com", topic: "event-driven" },
  { query: "cqrs event sourcing sample project site:github.com", topic: "cqrs" },
  { query: "microservices architecture sample reference site:github.com", topic: "microservices" },
  { query: "modular monolith production sample site:github.com", topic: "modular-monolith" },
  { query: "clean architecture python reference site:github.com", topic: "clean-architecture" },
  { query: "clean architecture golang sample project site:github.com", topic: "clean-architecture" },
  { query: "clean architecture spring boot java site:github.com", topic: "clean-architecture" },
  { query: "clean architecture dotnet csharp site:github.com", topic: "clean-architecture" },
  { query: "serverless microservices architecture sample site:github.com", topic: "serverless" },
  { query: "domain driven design aggregate root repository site:github.com", topic: "domain-driven-design" },
];

/**
 * Authenticated Web Search Collector.
 * Queries search engines using authenticated API keys (Tavily, Serper, or Google Custom Search)
 * to discover top architectural GitHub repositories.
 */
export async function collectRepositoriesViaAuthenticatedWebSearch(): Promise<Repository[]> {
  const apiKey =
    process.env.WEB_SEARCH_API_KEY ||
    process.env.TAVILY_API_KEY ||
    process.env.SERPER_API_KEY ||
    process.env.GOOGLE_SEARCH_API_KEY;

  if (!apiKey) {
    console.log(
      "ℹ️  [Web Search Collector] Skipping authenticated web search: No WEB_SEARCH_API_KEY / TAVILY_API_KEY / SERPER_API_KEY found in .env."
    );
    return [];
  }

  const provider =
    process.env.WEB_SEARCH_PROVIDER ||
    (process.env.TAVILY_API_KEY
      ? "tavily"
      : process.env.SERPER_API_KEY
      ? "serper"
      : process.env.GOOGLE_SEARCH_API_KEY
      ? "google"
      : "tavily");

  console.log(`\n🔍 [Web Search Collector] Authenticated web search active using provider: ${provider}`);
  const discoveredRepos: Repository[] = [];
  const seenRepoSlugs = new Set<string>();

  for (const { query, topic } of ARCHITECTURAL_WEB_SEARCH_QUERIES) {
    try {
      console.log(`🌐 Searching web for: "${query}"...`);
      const links = await performAuthenticatedSearch(query, provider, apiKey);

      for (const link of links) {
        const parsed = extractGitHubOwnerAndRepo(link);
        if (!parsed) continue;

        const slug = `${parsed.owner}/${parsed.repo}`.toLowerCase();
        if (seenRepoSlugs.has(slug)) continue;
        seenRepoSlugs.add(slug);

        const repo = await fetchSingleRepository(parsed.owner, parsed.repo, "tier_3_verified_oss");
        if (repo) {
          repo.source = "web";
          const currentTopics = repo.topics ?? [];
          if (!currentTopics.includes(topic)) {
            repo.topics = [...currentTopics, topic];
          }
          discoveredRepos.push(repo);
          collectionStatistics.incrementRepositories(1);
          console.log(`   ✨ Found & verified repository from web: ${repo.fullName} [Topic: ${topic}]`);
        }
      }

      // Throttle web searches slightly to respect rate limits
      await new Promise((res) => setTimeout(res, 1500));
    } catch (err: any) {
      console.warn(`   ⚠️ Web search failed for query "${query}": ${err.message || err}`);
    }
  }

  console.log(`✅ [Web Search Collector] Discovered ${discoveredRepos.length} architectural repositories via web search.`);
  return discoveredRepos;
}

/**
 * Dispatches query to the configured authenticated provider.
 */
async function performAuthenticatedSearch(
  query: string,
  provider: string,
  apiKey: string
): Promise<string[]> {
  if (provider === "serper") {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });

    if (!res.ok) {
      throw new Error(`Serper API returned ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    const organic = data.organic || [];
    return organic.map((item: any) => item.link).filter(Boolean);
  }

  if (provider === "google") {
    const cx = process.env.GOOGLE_SEARCH_CX || "";
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(
      apiKey
    )}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=10`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google Search API returned ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    const items = data.items || [];
    return items.map((item: any) => item.link).filter(Boolean);
  }

  // Default: Tavily API (https://api.tavily.com/search)
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      include_domains: ["github.com"],
      max_results: 10,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily API returned ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  const results = data.results || [];
  return results.map((item: any) => item.url).filter(Boolean);
}

/**
 * Extracts owner and repo from a GitHub URL, filtering out non-repository URLs.
 */
export function extractGitHubOwnerAndRepo(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter((p) => p.trim().length > 0);
    if (parts.length < 2) return null;

    const [owner, repoWithSuffix] = parts;
    const repo = repoWithSuffix.replace(/\.git$/, "");

    // Ignore reserved paths
    const reserved = new Set([
      "features",
      "topics",
      "trending",
      "collections",
      "marketplace",
      "explore",
      "pricing",
      "login",
      "signup",
      "settings",
      "orgs",
      "about",
    ]);

    if (reserved.has(owner.toLowerCase())) return null;

    return { owner, repo };
  } catch {
    return null;
  }
}
