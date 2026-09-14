import type { Endpoints } from "@octokit/types";
import type { Repository } from "../../models/repository.models";
import type { SourceTier } from "../../services/assets/asset.interface";

type GitHubRepository =
  Endpoints["GET /search/repositories"]["response"]["data"]["items"][number];

export function mapGitHubRepository(
  repo: GitHubRepository,
  sourceTier: SourceTier = "tier_4_public_pool"
): Repository {
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
    sourceTier, // <-- Set the reliability tier
    topics: repo.topics ?? [],
    createdAt: repo.created_at ?? null,
    updatedAt: repo.updated_at ?? null,
  };
}
