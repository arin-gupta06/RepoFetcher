export function buildRepositorySearchQuery(language: string): string {
  return `language:${language} stars:>500`;
}

export const githubRepositorySearchOptions = {
  sort: "stars",
  order: "desc",
  per_page: 10,
} as const;
