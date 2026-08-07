import type { Endpoints } from "@octokit/types";
import type { Repository } from "../../models/repository.model";

type GitHubRepository =
  Endpoints["GET /search/repositories"]["response"]["data"]["items"][number];

export function mapGitHubRepository(repo: GitHubRepository): Repository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    defaultBranch: repo.default_branch,
    owner: {
      login: repo.owner?.login ?? "",
      avatarUrl: repo.owner?.avatar_url ?? "",
      profileUrl: repo.owner?.html_url ?? "",
    },
    source: "github",
    topics: repo.topics ?? [],
    createdAt: repo.created_at ?? null,
    updatedAt: repo.updated_at ?? null,
  };
}
