import type { Repository } from "../../models/repository.model";

import { AssetService } from "../../services/assets";
import { collectionStatistics } from "../../statistics/collection.statistics";

import { extractDiagrams } from "./extractors/diagram.extractors";
import { shouldKeepImage } from "./filters/asset.filter";

const assetService = new AssetService();

export async function collectRepositoryDiagrams(
    repository: Repository
): Promise<Repository> {

    if (!repository.readme?.content) {
        return repository;
    }

    const diagramUrls = extractDiagrams(
        repository.readme.content,
        {
            owner: repository.owner.login,
            repository: repository.name,
            branch: repository.defaultBranch,
        }
    );

    collectionStatistics.incrementDiagramsExtracted(diagramUrls.length);

    repository.diagrams = [];

    for (const url of diagramUrls) {
        if (!shouldKeepImage(url)) {
            continue;
        }

        try {
            const asset = await assetService.process({
                repositoryId: repository.id,
                repositoryName: repository.name,
                url,
                type: "diagram",
            });

            repository.diagrams.push(asset);
            collectionStatistics.incrementDiagramsProcessed();

        } catch (error) {
            collectionStatistics.incrementDiagramFailures();

            console.error(
                `[DiagramCollector] Failed to process ${url}`
            );

            console.error(error);
        }
    }

    return repository;
}
