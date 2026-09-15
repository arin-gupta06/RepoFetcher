import type { Repository } from "../models/repository.models";
import type { StructuralFingerprint } from "../models/structural-fingerprint.models";
import type { CleanedRepositorySample } from "../models/dataset.models";
import { TextCleaner } from "./text.cleaner";
import { TIER_1_CANONICAL_TEMPLATES, CURATED_REFERENCE_REPOSITORIES } from "../constants/curated-sources.constants";

export class FeatureNormalizer {
  /**
   * Transforms raw repository record and structural fingerprint into a normalized dataset sample.
   */
  public static normalizeSample(
    repo: Repository,
    fingerprint?: StructuralFingerprint | null
  ): CleanedRepositorySample {
    const cleanedReadme = TextCleaner.cleanMarkdown(repo.readme?.content);

    const cleanedArchDocs = (repo.architectureDocs ?? []).map((doc) =>
      TextCleaner.cleanMarkdown(doc.content)
    );

    // Extract framework list from dependency manifests
    const frameworksSet = new Set<string>();
    if (fingerprint?.manifests) {
      for (const manifest of fingerprint.manifests) {
        for (const fw of manifest.frameworkDetected) {
          frameworksSet.add(fw);
        }
      }
    }

    // Detected layers summary
    const detectedLayers = (fingerprint?.detectedLayers ?? []).map((layer) => ({
      layerName: layer.layerName.toLowerCase(),
      fileCount: layer.matchPaths.length,
      samplePaths: layer.matchPaths.slice(0, 3),
    }));

    const validDiagramsCount = (repo.diagrams ?? []).filter(
      (d) => d.diagramType && d.diagramType !== "noise" && d.diagramType !== "ui_screenshot"
    ).length;

    const diagramTypes = Array.from(
      new Set(
        (repo.diagrams ?? [])
          .map((d) => d.diagramType)
          .filter((t): t is NonNullable<typeof t> => Boolean(t))
      )
    );

    // Determine target architecture pattern label
    const architecturePattern = this.inferArchitecturePattern(repo, detectedLayers, Array.from(frameworksSet));

    return {
      id: repo.id,
      fullName: repo.fullName,
      name: repo.name,
      owner: repo.owner?.login ?? "unknown",
      language: repo.language ?? "Unknown",
      stars: repo.stars ?? 0,
      forks: repo.forks ?? 0,
      sourceTier: repo.sourceTier ?? "tier_4_public_pool",
      cleanedReadme,
      cleanedArchitectureDocs: cleanedArchDocs,
      detectedFrameworks: Array.from(frameworksSet),
      detectedLayers,
      entryPoints: fingerprint?.entryPoints ?? [],
      totalFiles: fingerprint?.totalFiles ?? 0,
      totalDirectories: fingerprint?.totalDirectories ?? 0,
      validDiagramsCount,
      diagramTypes,
      architecturePattern,
    };
  }

  /**
   * Rule-based heuristic to assign architecture pattern target label for training data.
   */
  private static inferArchitecturePattern(
    repo: Repository,
    layers: Array<{ layerName: string; fileCount: number }>,
    frameworks: string[]
  ): string {
    // 1. Check curated seed ground-truth overrides
    const curated = CURATED_REFERENCE_REPOSITORIES.find(
      (c) => c.owner.toLowerCase() === repo.owner?.login?.toLowerCase() && c.repo.toLowerCase() === repo.name?.toLowerCase()
    );
    if (curated) {
      return curated.architecturePattern;
    }

    const topics = (repo.topics ?? []).map((t) => t.toLowerCase().replace(/^topic:/, ""));

    // 2. High-Confidence Architectural Topic Mapping
    if (
      topics.includes("clean-architecture") ||
      topics.includes("hexagonal-architecture") ||
      topics.includes("onion-architecture")
    ) {
      return "Clean Architecture / Hexagonal";
    }

    if (
      topics.includes("microservices") ||
      topics.includes("microservice") ||
      topics.includes("dapr")
    ) {
      return "Microservices Architecture";
    }

    if (
      topics.includes("event-driven") ||
      topics.includes("kafka") ||
      topics.includes("rabbitmq")
    ) {
      return "Event-Driven Architecture";
    }

    if (
      topics.includes("domain-driven-design") ||
      topics.includes("ddd") ||
      topics.includes("cqrs") ||
      topics.includes("event-sourcing")
    ) {
      return "Domain-Driven Design / CQRS";
    }

    if (
      topics.includes("serverless") ||
      topics.includes("lambda")
    ) {
      return "Serverless Architecture";
    }

    if (
      topics.includes("modular-monolith")
    ) {
      return "Modular Monolith Architecture";
    }

    if (
      topics.includes("mvc") ||
      topics.includes("layered-architecture") ||
      topics.includes("repository-pattern")
    ) {
      return "Layered Backend Architecture";
    }

    const layerNames = layers.map((l) => l.layerName);

    // 3. Pattern Heuristics
    const hasControllers = layerNames.includes("controllers") || layerNames.includes("routes");
    const hasServices = layerNames.includes("services");
    const hasRepos = layerNames.includes("repositories") || layerNames.includes("models");
    const hasInfra = layerNames.includes("infrastructure");

    if (hasControllers && hasServices && hasRepos && hasInfra) {
      return "Clean Architecture / Hexagonal";
    }

    if (hasControllers && hasServices && hasRepos) {
      return "Layered Backend Architecture";
    }

    if (frameworks.includes("NestJS")) {
      return "Modular Layered Architecture";
    }

    if (frameworks.includes("FastAPI")) {
      return "FastAPI Async Web Service";
    }

    if (frameworks.includes("Spring Boot")) {
      return "Spring Boot Layered";
    }

    if (frameworks.includes("Kafka") || frameworks.includes("RabbitMQ")) {
      return "Event-Driven Architecture";
    }

    return "General Modular Architecture";
  }
}
