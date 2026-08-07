import { languages } from "../constants/languages.constants";

import type { CollectionResult } from "../models/collection-result.models";
import type { Dataset } from "../models/datasets.models";
import type { RepositoryReadme } from "../models/readme.models";
import type { Repository } from "../models/repository.model";

import { collectRepositoryReadme } from "./assets/readme.collector";
import { collectRepositoryImages } from "./assets/image.collector";
import { collectRepositoryDiagrams } from "./assets/diagram.collector";

import { collectGitHubRepositories } from "./github/github.collector";
import { collectKaggleDatasets } from "./kaggle/kaggle.collector";

export async function collectResources(): Promise<CollectionResult> {

    const repositories: Repository[] = [];
    const datasets: Dataset[] = [];
    const readmes: RepositoryReadme[] = [];

    for (const language of languages) {
        const githubRepositories =
            await collectGitHubRepositories(language);

        repositories.push(...githubRepositories);
    }

    datasets.push(...await collectKaggleDatasets());

    await Promise.all(
        repositories.map(async (repository) => {

            const readme =
                await collectRepositoryReadme(repository);

            if (!readme) {
                return;
            }

            repository.readme = readme;

            readmes.push(readme);

            await collectRepositoryDiagrams(repository);

            await collectRepositoryImages(repository);
        })
    );

    return {
        repositories,
        datasets,
        readmes,
    };
}
