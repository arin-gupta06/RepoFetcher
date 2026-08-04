import { octokit } from "../../config/github";
import type { Repository } from "../../models/repository.model";
import { mapGitHubRepository } from "./github.mapper";
import {
  buildRepositorySearchQuery,
  githubRepositorySearchOptions,
} from "./github.query";

export async function collectGitHubRepositories(
  language: string,
): Promise<Repository[]> {
  const response = await octokit.search.repos({
    q: buildRepositorySearchQuery(language),
    ...githubRepositorySearchOptions,
  });

  return response.data.items.map(mapGitHubRepository);
}
