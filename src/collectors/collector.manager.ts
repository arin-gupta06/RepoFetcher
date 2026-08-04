import { languages } from "../constants/languages.constants";
import type { Repository } from "../models/repository.model";
import { collectRepositoryDiagrams } from "./assets/diagram.collector";
import { collectRepositoryImages } from "./assets/image.collector";
import { collectRepositoryReadme } from "./assets/readme.collector";
import { collectGitHubRepositories } from "./github/github.collector";
import { collectKaggleRepositories } from "./kaggle/kaggle.collector";

export async function collectRepositories(): Promise<Repository[]> {
  const repositories: Repository[] = [];

  for (const language of languages) {
    const githubRepositories = await collectGitHubRepositories(language);
    repositories.push(...githubRepositories);
  }

  repositories.push(...(await collectKaggleRepositories()));

  return Promise.all(repositories.map(collectRepositoryAssets));
}

async function collectRepositoryAssets(
  repository: Repository,
): Promise<Repository> {
  const withReadme = await collectRepositoryReadme(repository);
  const withImages = await collectRepositoryImages(withReadme);
  return collectRepositoryDiagrams(withImages);
}
