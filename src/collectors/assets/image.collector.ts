import type { Repository } from "../../models/repository.model";

import { AssetService } from "../../services/assets";
import { collectionStatistics } from "../../statistics/collection.statistics";

import { extractImages } from "./extractors/image.extractors";
import { shouldKeepImage } from "./filters/asset.filter";

const assetService = new AssetService();

export async function collectRepositoryImages(
    repository: Repository
): Promise<Repository> {

    if (!repository.readme?.content) {
        return repository;
    }

    console.log(
        `[ImageCollector] Processing ${repository.fullName}`
    );

    const imageUrls = extractImages(
        repository.readme.content,
        {
            owner: repository.owner.login,
            repository: repository.name,
            branch: repository.defaultBranch,
        }
    );

    collectionStatistics.incrementImagesExtracted(imageUrls.length);

    repository.images = [];

    for (const url of imageUrls) {
        if (repository.diagrams?.some((diagram) => (
            diagram.originalUrl === url
        ))) {
            collectionStatistics.incrementImagesFiltered();

            continue;
        }

        if (!shouldKeepImage(url)) {
            collectionStatistics.incrementImagesFiltered();

            continue;
        }

        try {
            const asset = await assetService.process({
                repositoryId: repository.id,
                repositoryName: repository.name,
                url,
                type: "image",
            });

            repository.images.push(asset);
            collectionStatistics.incrementImagesUploaded();

        } catch (error) {
            collectionStatistics.incrementImageFailures();

            console.error(
                `[ImageCollector] Failed to process ${url}`
            );

            console.error(error);
        }
    }

    return repository;
}
