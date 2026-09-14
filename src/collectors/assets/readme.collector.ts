import { RepositoryReadme } from "../../models/readme.models";
import type { Repository } from "../../models/repository.models";
import { octokit } from "../../config/github";
import { collectionStatistics } from "../../statistics/collection.statistics";

export async function collectRepositoryReadme(
  repository: Repository,
): Promise<RepositoryReadme | null> {
  // 1. Try unmetered raw CDN first to preserve GitHub API quota
  const rawUrl = `https://raw.githubusercontent.com/${repository.owner.login}/${repository.name}/${repository.defaultBranch}/README.md`;

  try {
    const rawResponse = await fetch(rawUrl);
    if (rawResponse.ok) {
      const content = await rawResponse.text();
      if (content && content.trim().length > 0) {
        collectionStatistics.incrementReadmes();
        return {
          repositoryId: repository.id,
          name: "README.md",
          path: "README.md",
          sha: "",
          url: rawUrl,
          htmlUrl: `${repository.url}/blob/${repository.defaultBranch}/README.md`,
          downloadUrl: rawUrl,
          size: Buffer.byteLength(content, "utf8"),
          encoding: "base64",
          content,
          fetchedAt: new Date(),
          source: "github",
        };
      }
    }
  } catch {
    // Fall back to Octokit API
  }

  // 2. Fallback to Octokit REST API (handles non-standard case like Readme.markdown)
  try {
    const response = await octokit.rest.repos.getReadme({
      owner: repository.owner.login,
      repo: repository.name,
    });

    collectionStatistics.incrementReadmes();

    return mapReadmeResponse(repository, response.data);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    return null;
  }
}

type GitHubReadmeResponse = Awaited<
  ReturnType<typeof octokit.rest.repos.getReadme>
>["data"];

function mapReadmeResponse(
  repository: Repository,
  response: GitHubReadmeResponse
): RepositoryReadme {
  return {
    repositoryId: repository.id,
    name: response.name,
    path: response.path,
    sha: response.sha,

    url: response.url,
    htmlUrl: response.html_url,
    downloadUrl: response.download_url,

    size: response.size,
    encoding: response.encoding as "base64",

    content: Buffer.from(response.content, "base64").toString("utf8"),

    fetchedAt: new Date(),

    source: "github",
  };
}
