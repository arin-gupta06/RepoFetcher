import type {
  CleanedRepositorySample,
  InstructionTuningPair,
  ArchitectureClassificationSample,
  DatasetSplit,
} from "../models/dataset.models";

// ---------------------------------------------------------------------------
// Instruction Templates — 6 diverse task phrasings per sample
// ---------------------------------------------------------------------------
const INSTRUCTION_TEMPLATES: Array<{
  instruction: string;
  buildInput: (s: CleanedRepositorySample, frameworks: string, layers: string, readmeSlice: string, layerList: string) => string;
  buildOutput: (s: CleanedRepositorySample, frameworks: string, layers: string) => string;
}> = [
  {
    instruction:
      "Analyze the repository metrics and file layout to identify the software architectural pattern.",
    buildInput: (s, frameworks, layers, readmeSlice) =>
      `Repository: ${s.fullName}
Primary Language: ${s.language}
Frameworks: ${frameworks}
Repository Size: ${s.totalFiles} files, ${s.totalDirectories} directories
Detected Directory Layers:
${layers}

Readme Summary:
${readmeSlice}`,
    buildOutput: (s, frameworks) =>
      `Architecture Analysis for ${s.fullName}:
- Recommended Pattern: ${s.architecturePattern}
- Key Frameworks Identified: ${frameworks}
- Identified Layers: ${s.detectedLayers.map((l) => l.layerName).join(", ") || "N/A"}
- Diagnostic Summary: The codebase follows a ${s.architecturePattern} structure using ${s.language}.`,
  },
  {
    instruction:
      "Given the following repository metadata, classify it into one of the standard software architecture categories.",
    buildInput: (s, frameworks, _layers, _readme, layerList) =>
      `Name: ${s.fullName}
Language: ${s.language}
Stars: ${s.stars}
Detected Frameworks: ${frameworks}
Architectural Layers: ${layerList || "None detected"}
Total Files: ${s.totalFiles}
Has Architecture Docs: ${s.cleanedArchitectureDocs.length > 0 ? "Yes" : "No"}`,
    buildOutput: (s) =>
      `Classification Result:
Architecture Pattern: ${s.architecturePattern}
Confidence Tier: ${s.sourceTier}
Rationale: Based on the presence of ${s.detectedLayers.map((l) => l.layerName).join(", ") || "general project structure"} and ${s.language} language conventions, this repository follows a ${s.architecturePattern}.`,
  },
  {
    instruction:
      "Review this open-source repository and summarize its architecture design, layers, and key technology choices.",
    buildInput: (s, frameworks, layers, readmeSlice) =>
      `Repository: ${s.fullName} (${s.language})
${readmeSlice ? `README:\n${readmeSlice}` : "No README available."}

Detected Structure:
Frameworks: ${frameworks}
Directory Layers Detected:
${layers}
File Count: ${s.totalFiles} | Directory Count: ${s.totalDirectories}`,
    buildOutput: (s, frameworks) =>
      `Architecture Summary for ${s.fullName}:
Pattern: ${s.architecturePattern}
Technology Stack: ${frameworks || s.language}
Key Structural Layers: ${s.detectedLayers.map((l) => l.layerName).join(", ") || "Standard flat project layout"}
Architecture Docs Present: ${s.cleanedArchitectureDocs.length > 0 ? "Yes" : "No"}
Overall Assessment: This is a ${s.language}-based project implementing ${s.architecturePattern}. It has ${s.totalFiles} files organized across ${s.totalDirectories} directories.`,
  },
  {
    instruction:
      "You are a software architect. Evaluate the structure of the given repository and recommend the closest architectural pattern.",
    buildInput: (s, frameworks, _layers, readmeSlice) =>
      `Project: ${s.name}
Owner: ${s.owner}
Language: ${s.language}
Popularity: ${s.stars} stars, ${s.forks} forks
Frameworks & Libraries: ${frameworks}
Readme Context: ${readmeSlice.slice(0, 500) || "Not available"}`,
    buildOutput: (s, frameworks) =>
      `Architectural Evaluation for ${s.fullName}:

Recommended Pattern: **${s.architecturePattern}**

Key Observations:
- Language: ${s.language}
- Frameworks used: ${frameworks || "None detected"}
- Structural layers: ${s.detectedLayers.map((l) => `${l.layerName} (${l.fileCount} files)`).join(", ") || "No standard layers detected"}
- Diagram assets: ${s.validDiagramsCount} architectural diagrams found

Conclusion: This repository exhibits characteristics of ${s.architecturePattern} pattern. ${s.cleanedArchitectureDocs.length > 0 ? "Architecture documentation is available." : "No dedicated architecture documentation found."}`,
  },
  {
    instruction:
      "What software design pattern does this GitHub repository use? Analyze its structure and provide a detailed answer.",
    buildInput: (s, frameworks, layers) =>
      `GitHub Repository: ${s.fullName}
Language: ${s.language}
Stars: ${s.stars}
Forks: ${s.forks}
Frameworks: ${frameworks}
Structural Layout:
${layers}`,
    buildOutput: (s, frameworks) =>
      `Design Pattern Analysis:
Repository ${s.fullName} uses the **${s.architecturePattern}** design pattern.

Evidence:
1. Language: ${s.language} - aligns with ${s.architecturePattern} conventions
2. Frameworks detected: ${frameworks || "vanilla"}
3. Directory structure: ${s.detectedLayers.map((l) => l.layerName).join(", ") || "flat"}
4. Codebase size: ${s.totalFiles} files — ${s.totalFiles > 100 ? "large codebase suggesting mature architecture" : "smaller project"}`,
  },
  {
    instruction:
      "Generate a structured architecture report for this repository including pattern, layers, and framework analysis.",
    buildInput: (s, frameworks, layers, readmeSlice) =>
      `## Repository Metadata
- Full Name: ${s.fullName}
- Primary Language: ${s.language}
- Stars: ${s.stars} | Forks: ${s.forks}
- Source Tier: ${s.sourceTier}

## Technology Stack
${frameworks ? `Frameworks: ${frameworks}` : "No specific frameworks detected"}

## Directory Structure
${layers}

## Documentation
${readmeSlice ? readmeSlice.slice(0, 600) : "No README found"}`,
    buildOutput: (s, frameworks) =>
      `## Architecture Report: ${s.fullName}

### Pattern Identification
**${s.architecturePattern}**

### Layer Analysis
${s.detectedLayers.length > 0
  ? s.detectedLayers.map((l) => `- **${l.layerName}**: ${l.fileCount} files (e.g., ${l.samplePaths.slice(0, 2).join(", ")})`).join("\n")
  : "- No standard architectural layers detected"}

### Framework Analysis
${frameworks || "No frameworks identified"}

### Quality Indicators
- Architecture documentation: ${s.cleanedArchitectureDocs.length > 0 ? "Present" : "Not found"}
- Architectural diagrams: ${s.validDiagramsCount} found
- Codebase size: ${s.totalFiles} files, ${s.totalDirectories} directories
- Source quality tier: ${s.sourceTier}`,
  },
];

export class DatasetFormatter {
  /**
   * Generates multiple diverse instruction-tuning pairs from a single cleaned repository sample.
   * Each sample produces up to INSTRUCTION_TEMPLATES.length distinct training pairs.
   */
  public static toInstructionPairs(sample: CleanedRepositorySample): InstructionTuningPair[] {
    const frameworks = sample.detectedFrameworks.length > 0
      ? sample.detectedFrameworks.join(", ")
      : "None detected";

    const layerList = sample.detectedLayers.map((l) => l.layerName).join(", ");

    const layerSummary = sample.detectedLayers.length > 0
      ? sample.detectedLayers.map((l) => `- ${l.layerName} (${l.fileCount} files)`).join("\n")
      : "No standard architectural layers detected.";

    const readmeSlice = sample.cleanedReadme.slice(0, 800) || "No README provided.";

    return INSTRUCTION_TEMPLATES.map((template, idx) => ({
      id: `inst_${sample.id}_v${idx + 1}`,
      instruction: template.instruction,
      input: template.buildInput(sample, frameworks, layerSummary, readmeSlice, layerList),
      output: template.buildOutput(sample, frameworks, layerSummary),
      systemPrompt: "You are RepoLens AI, an expert software architecture intelligence assistant.",
      meta: {
        repository: sample.fullName,
        sourceTier: sample.sourceTier,
        language: sample.language,
        variant: idx + 1,
      },
    }));
  }

  /**
   * Legacy single-pair method for compatibility.
   */
  public static toInstructionPair(sample: CleanedRepositorySample): InstructionTuningPair {
    return this.toInstructionPairs(sample)[0];
  }

  /**
   * Transforms a cleaned repository sample into a structured classification feature record.
   */
  public static toClassificationSample(sample: CleanedRepositorySample): ArchitectureClassificationSample {
    return {
      repoId: sample.id,
      fullName: sample.fullName,
      language: sample.language,
      stars: sample.stars,
      sourceTier: sample.sourceTier,
      totalFiles: sample.totalFiles,
      totalDirectories: sample.totalDirectories,
      frameworks: sample.detectedFrameworks,
      layersPresent: sample.detectedLayers.map((l) => l.layerName),
      hasArchitectureDocs: sample.cleanedArchitectureDocs.length > 0,
      diagramsCount: sample.validDiagramsCount,
      architecturePattern: sample.architecturePattern,
    };
  }

  /**
   * Splits an array of data into Train (80%), Val (10%), and Test (10%) sets reproducibly.
   */
  public static createSplit<T>(items: T[], trainRatio = 0.8, valRatio = 0.1): DatasetSplit<T> {
    const shuffled = [...items];

    // Deterministic pseudo-random shuffle (Fisher-Yates with fixed seed logic)
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (i * 31 + 7) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const total = shuffled.length;
    const trainEnd = Math.floor(total * trainRatio);
    const valEnd = Math.floor(total * (trainRatio + valRatio));

    const train = shuffled.slice(0, trainEnd);
    const val = shuffled.slice(trainEnd, valEnd);
    const test = shuffled.slice(valEnd);

    return {
      train,
      val,
      test,
      metadata: {
        totalSamples: total,
        trainCount: train.length,
        valCount: val.length,
        testCount: test.length,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
