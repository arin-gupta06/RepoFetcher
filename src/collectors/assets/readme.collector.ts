import { RepositoryReadme } from "../../models/readme.models";
import type { Repository } from "../../models/repository.model";
import { octokit } from "../../config/github";
export async function collectRepositoryReadme(
  repository: Repository,
): Promise<RepositoryReadme | null> {
  try {
    const response = await octokit.rest.repos.getReadme({
      owner: repository.owner.login,
      repo: repository.name,
    })

    return mapReadmeResponse(repository, response.data)
  } catch (error: any) {
    if(error.status === 404){
      return null;
    }

    throw error;
    
  }
}

type GitHubReadmeResponse = Awaited<
  ReturnType<typeof octokit.rest.repos.getReadme>
>["data"];
function mapReadmeResponse(
  repository: Repository,
  response: GitHubReadmeResponse
): RepositoryReadme{
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

    source: "github"
  }
}
