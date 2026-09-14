import type { Repository } from "../../models/repository.models";
import { AssetService } from "../../services/assets";
import { collectionStatistics } from "../../statistics/collection.statistics";
import { PhashService } from "../../services/assets/phash.service";
import { DiagramClassifierService } from "../../services/assets/diagram-classifier.service";
import { extractDiagramsWithContext } from "./extractors/diagram.extractors";
import { shouldKeepImage } from "./filters/asset.filter";

const assetService = new AssetService();
const seenPhashes = new Set<string>();

export async function collectRepositoryDiagrams(
  repository: Repository
): Promise<Repository> {
  if (!repository.readme?.content) {
    return repository;
  }

  const candidates = extractDiagramsWithContext(repository.readme.content, {
    owner: repository.owner.login,
    repository: repository.name,
    branch: repository.defaultBranch,
  });

  collectionStatistics.incrementDiagramsExtracted(candidates.length);
  repository.diagrams = [];

  for (const candidate of candidates) {
    if (!shouldKeepImage(candidate.url)) continue;

    try {
      const { diagramType } = DiagramClassifierService.classify(candidate.context);
      if (diagramType === "ui_screenshot" || diagramType === "noise") {
        continue;
      }

      const asset = await assetService.process({
        repositoryId: repository.id,
        repositoryName: repository.name,
        url: candidate.url,
        type: "diagram",
        sourceTier: repository.sourceTier,
        context: candidate.context,
      });

      // Perceptual deduplication check
      if (asset.metadata.phash) {
        let isDuplicate = false;
        for (const existingHash of seenPhashes) {
          if (PhashService.isVisualDuplicate(existingHash, asset.metadata.phash)) {
            isDuplicate = true;
            break;
          }
        }
        if (isDuplicate) {
          collectionStatistics.incrementImagesFiltered();
          continue;
        }
        seenPhashes.add(asset.metadata.phash);
      }

      asset.diagramType = diagramType;
      asset.reliabilityScore = DiagramClassifierService.calculateReliabilityScore(
        repository.sourceTier,
        diagramType,
        Boolean(candidate.context.sectionHeading)
      );

      repository.diagrams.push(asset);
      collectionStatistics.incrementDiagramsProcessed();
    } catch (error) {
      collectionStatistics.incrementDiagramFailures();
    }
  }

  return repository;
}
