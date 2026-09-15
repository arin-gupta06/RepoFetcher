import type { SourceTier } from "../services/assets/asset.interface";

export interface CleanedRepositorySample {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  language: string;
  stars: number;
  forks: number;
  sourceTier: SourceTier;
  
  // Cleaned Text Features
  cleanedReadme: string;
  cleanedArchitectureDocs: string[];
  
  // Structural Features
  detectedFrameworks: string[];
  detectedLayers: Array<{
    layerName: string;
    fileCount: number;
    samplePaths: string[];
  }>;
  entryPoints: string[];
  totalFiles: number;
  totalDirectories: number;
  
  // Visual Asset Features
  validDiagramsCount: number;
  diagramTypes: string[];
  
  // Derived Target Label (e.g. Architecture Pattern)
  architecturePattern: string;
}

export interface InstructionTuningPair {
  id: string;
  instruction: string;
  input: string;
  output: string;
  systemPrompt?: string;
  meta?: {
    repository: string;
    sourceTier: string;
    language: string;
    variant?: number;
  };
}

export interface ArchitectureClassificationSample {
  repoId: number;
  fullName: string;
  language: string;
  stars: number;
  sourceTier: SourceTier;
  
  // Numerical / Categorical Features
  totalFiles: number;
  totalDirectories: number;
  frameworks: string[];
  layersPresent: string[];
  hasArchitectureDocs: boolean;
  diagramsCount: number;
  
  // Label for Model Training
  architecturePattern: string;
}

export interface DatasetSplit<T> {
  train: T[];
  val: T[];
  test: T[];
  metadata: {
    totalSamples: number;
    trainCount: number;
    valCount: number;
    testCount: number;
    createdAt: string;
  };
}
