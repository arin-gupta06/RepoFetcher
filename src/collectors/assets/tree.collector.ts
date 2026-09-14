import { octokit } from "../../config/github";
import type {
  DirectoryLayerMatch,
  StructuralFingerprint,
} from "../../models/structural-fingerprint.models";
import type { Repository } from "../../models/repository.models";

const KNOWN_LAYERS: Record<string, RegExp> = {
  controllers: /(^|\/)(controllers?|handlers?|routes?|api)(\/|$)/i,
  services: /(^|\/)(services?|usecases?|business)(\/|$)/i,
  repositories: /(^|\/)(repositories?|repos?|daos?|queries)(\/|$)/i,
  models: /(^|\/)(models?|entities?|schemas?|domain)(\/|$)/i,
  middleware: /(^|\/)(middlewares?|interceptors?|guards?)(\/|$)/i,
  infrastructure: /(^|\/)(infra|infrastructure|adapters?)(\/|$)/i,
};

const ENTRY_POINT_PATTERNS = [
  /^src\/(main|index|app|server)\.[jt]sx?$/i,
  /^(main|index|app|server)\.[jt]sx?$/i,
  /^main\.go$/i,
  /^app\.py$/i,
  /src\/main\/java\/.*Application\.java$/i,
];

export async function collectRepositoryFingerprint(
  repository: Repository
): Promise<StructuralFingerprint | null> {
  try {
    const { data } = await octokit.rest.git.getTree({
      owner: repository.owner.login,
      repo: repository.name,
      tree_sha: repository.defaultBranch,
      recursive: "1",
    });

    if (!data.tree) return null;

    const layerMatches: Record<string, string[]> = {};
    for (const layer of Object.keys(KNOWN_LAYERS)) {
      layerMatches[layer] = [];
    }

    const entryPoints: string[] = [];
    let totalFiles = 0;
    let totalDirectories = 0;

    for (const item of data.tree) {
      if (!item.path) continue;

      if (item.type === "blob") {
        totalFiles++;
        if (ENTRY_POINT_PATTERNS.some((pattern) => pattern.test(item.path!))) {
          entryPoints.push(item.path);
        }
      } else if (item.type === "tree") {
        totalDirectories++;
      }

      for (const [layer, regex] of Object.entries(KNOWN_LAYERS)) {
        if (regex.test(item.path)) {
          if (layerMatches[layer].length < 10) {
            layerMatches[layer].push(item.path);
          }
        }
      }
    }

    const detectedLayers: DirectoryLayerMatch[] = Object.entries(layerMatches)
      .filter(([_, paths]) => paths.length > 0)
      .map(([layerName, matchPaths]) => ({ layerName, matchPaths }));

    return {
      repositoryId: repository.id,
      repositoryFullName: repository.fullName,
      defaultBranch: repository.defaultBranch,
      entryPoints,
      manifests: [],
      detectedLayers,
      totalFiles,
      totalDirectories,
      collectedAt: new Date(),
    };
  } catch (error: any) {
    if (error.status === 404 || error.status === 409) {
      return null;
    }
    throw error;
  }
}
