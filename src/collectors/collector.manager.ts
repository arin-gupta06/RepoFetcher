import { languages } from "../constants/languages.constants";
import type { CollectionResult } from "../models/collection-result.models";
import type { Dataset } from "../models/datasets.models";
import { RepositoryReadme } from "../models/readme.models";
import type { Repository } from "../models/repository.model";

import { collectRepositoryDiagrams } from "./assets/diagram.collector";
import { collectRepositoryImages } from "./assets/image.collector";
import { collectRepositoryReadme } from "./assets/readme.collector";

import { collectGitHubRepositories } from "./github/github.collector";
import { collectKaggleDatasets } from "./kaggle/kaggle.collector";

export async function collectResources(): Promise<CollectionResult> {
    const repositories: Repository[] = [];
    const datasets: Dataset[] = [];
    const readmes: RepositoryReadme[] = [];

    for (const language of languages) {
        const githubRepositories = await collectGitHubRepositories(language);
        repositories.push(...githubRepositories);
    }
    datasets.push(...(await collectKaggleDatasets()));
    await Promise.all(
        repositories.map(async (repository) => {
            const readme = await collectRepositoryReadme(repository);

            if (readme) {
                readmes.push(readme);
            }
        }),
    );



    // const enrichedRepositories = await Promise.all(
    //     repositories.map(collectRepositoryAssets)
    // );

    return {
        repositories,
        datasets,
        readmes,
    };
}

