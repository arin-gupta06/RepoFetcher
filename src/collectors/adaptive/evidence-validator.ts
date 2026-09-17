import { ADAPTIVE_CONFIG } from "./adaptive.config";
import { Repository } from "../../models/repository.models";

export interface EvidenceValidationResult {
  isValid: boolean;
  evidenceScore: number;
  signals: string[];
  rejectionReason?: string;
}

/**
 * Architecture Evidence Safety Gate
 * Prevents zero-signal repositories, empty stubs, or badge-only pages from
 * polluting the architecture dataset.
 */
export class EvidenceValidator {
  private static ARCHITECTURAL_DIRECTORIES = new Set([
    "domain",
    "core",
    "controllers",
    "controller",
    "services",
    "service",
    "handlers",
    "handler",
    "infrastructure",
    "infra",
    "repositories",
    "repository",
    "routes",
    "router",
    "api",
    "modules",
    "module",
    "usecases",
    "usecase",
    "entities",
    "entity",
    "pkg",
    "cmd",
    "internal",
  ]);

  private static ARCHITECTURAL_KEYWORDS = [
    "architecture",
    "microservice",
    "domain-driven",
    "ddd",
    "clean architecture",
    "hexagonal",
    "event-driven",
    "cqrs",
    "serverless",
    "layer",
    "modular",
    "monolith",
    "mvc",
    "pipeline",
    "dependency injection",
  ];

  public static validateRepository(repo: Repository): EvidenceValidationResult {
    const signals: string[] = [];
    let score = 0.0;

    const fp = repo.fingerprint;
    const fileCount = fp?.totalFiles ?? 0;

    // 1. Check file count (Stub check)
    if (fileCount < ADAPTIVE_CONFIG.MIN_TOTAL_FILES && repo.sourceTier !== "tier_1_template") {
      return {
        isValid: false,
        evidenceScore: 0.05,
        signals,
        rejectionReason: `File count (${fileCount}) is below minimum threshold (${ADAPTIVE_CONFIG.MIN_TOTAL_FILES})`,
      };
    }

    if (fileCount >= 10) {
      score += 0.20;
      signals.push(`Substantial codebase (${fileCount} files)`);
    } else {
      score += 0.10;
      signals.push(`Moderate codebase (${fileCount} files)`);
    }

    // 2. Inspect structural layers
    const layers = fp?.detectedLayers || [];
    const matchedLayers: string[] = [];
    for (const layer of layers) {
      const name = layer.layerName;
      const lower = name.toLowerCase().replace(/[^a-z]/g, "");
      if (this.ARCHITECTURAL_DIRECTORIES.has(lower)) {
        matchedLayers.push(name);
      }
    }

    if (matchedLayers.length >= 3) {
      score += 0.35;
      signals.push(`Strong architectural layering (${matchedLayers.slice(0, 4).join(", ")})`);
    } else if (matchedLayers.length >= 1) {
      score += 0.20;
      signals.push(`Detected layer: ${matchedLayers.join(", ")}`);
    }

    // 3. Inspect detected frameworks across manifests
    const manifests = fp?.manifests || [];
    const detectedFrameworks: string[] = [];
    for (const manifest of manifests) {
      if (manifest.frameworkDetected && manifest.frameworkDetected.length > 0) {
        detectedFrameworks.push(...manifest.frameworkDetected);
      }
    }

    if (detectedFrameworks.length > 0) {
      const uniqueFws = Array.from(new Set(detectedFrameworks));
      score += 0.25;
      signals.push(`Verified framework stack: ${uniqueFws.slice(0, 3).join(", ")}`);
    }

    // 4. Inspect clean prose / keywords in README
    const rawReadme = repo.readme?.content || "";
    const cleanLower = rawReadme.toLowerCase();

    let keywordMatches = 0;
    for (const kw of this.ARCHITECTURAL_KEYWORDS) {
      if (cleanLower.includes(kw)) {
        keywordMatches++;
      }
    }

    if (keywordMatches >= 2) {
      score += 0.20;
      signals.push(`Architectural semantic keywords match count: ${keywordMatches}`);
    } else if (keywordMatches === 1) {
      score += 0.10;
      signals.push("Single architectural keyword matched");
    }

    // Normalized score cap at 1.0
    const finalScore = Math.min(1.0, Number(score.toFixed(3)));
    const isValid = finalScore >= ADAPTIVE_CONFIG.MIN_EVIDENCE_SCORE;

    return {
      isValid,
      evidenceScore: finalScore,
      signals,
      rejectionReason: isValid
        ? undefined
        : `Evidence score (${finalScore}) is below minimum threshold (${ADAPTIVE_CONFIG.MIN_EVIDENCE_SCORE})`,
    };
  }
}
