export const STAR_BRACKETS = [
  "500..800",
  "801..1500",
  "1501..3000",
  "3001..7000",
  "7001..15000",
  ">15000",
];

export const ARCHITECTURE_TOPICS = [
  "topic:clean-architecture",
  "topic:hexagonal-architecture",
  "topic:microservices",
  "topic:domain-driven-design",
  "topic:mvc",
  "topic:starter-kit",
];

export function buildRepositorySearchQuery(language: string): string {
  return `language:${language} stars:>500`;
}

export function buildPagedSearchQuery(
  language: string,
  starRange: string
): string {
  return `language:${language} stars:${starRange}`;
}

export function buildTopicSearchQuery(
  topic: string
): string {
  return `${topic} stars:>200`;
}

export const githubRepositorySearchOptions = {
  sort: "stars",
  order: "desc",
  per_page: 100,
} as const;

export const githubSearchOptions = {
  sort: "stars",
  order: "desc",
  per_page: 100,
} as const;
