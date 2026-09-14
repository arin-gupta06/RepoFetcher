import type {
  DiagramType,
  DiagramContext,
  SourceTier,
} from "./asset.interface";

export class DiagramClassifierService {
  public static classify(
    context?: DiagramContext
  ): { diagramType: DiagramType; confidence: number } {
    if (!context) {
      return { diagramType: "ui_screenshot", confidence: 0.5 };
    }

    if (context.isVectorCode) {
      return { diagramType: "architecture_diagram", confidence: 0.98 };
    }

    const text = [
      context.sectionHeading ?? "",
      context.altText ?? "",
      context.surroundingText ?? "",
    ].join(" ").toLowerCase();

    if (text.includes("sequence") || text.includes("lifecycle")) {
      return { diagramType: "sequence_diagram", confidence: 0.9 };
    }
    if (text.includes("flow") || text.includes("flowchart") || text.includes("pipeline")) {
      return { diagramType: "flowchart", confidence: 0.85 };
    }
    if (text.includes("erd") || text.includes("schema") || text.includes("database")) {
      return { diagramType: "schema_diagram", confidence: 0.9 };
    }
    if (text.includes("deployment") || text.includes("kubernetes") || text.includes("docker")) {
      return { diagramType: "deployment_diagram", confidence: 0.85 };
    }
    if (text.includes("architecture") || text.includes("system") || text.includes("design")) {
      return { diagramType: "architecture_diagram", confidence: 0.92 };
    }

    return { diagramType: "ui_screenshot", confidence: 0.6 };
  }

  public static calculateReliabilityScore(
    tier: SourceTier,
    diagramType: DiagramType,
    hasHeading: boolean
  ): number {
    let score = 0.5;
    if (tier === "tier_1_template") score = 1.0;
    else if (tier === "tier_2_official") score = 0.95;
    else if (tier === "tier_3_verified_oss") score = 0.8;
    else score = 0.5;

    if (hasHeading) score = Math.min(1.0, score + 0.05);
    if (diagramType === "ui_screenshot" || diagramType === "noise") {
      score = Math.max(0.1, score - 0.4);
    }

    return parseFloat(score.toFixed(2));
  }
}
