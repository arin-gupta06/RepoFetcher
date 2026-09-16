export interface Candidate {
  pattern: string;
  confidence: number;
  evidence: string[];
}

export interface TechnicalComponent {
  category: "presentation" | "business_logic" | "persistence" | "infrastructure";
  label: string;
  items: string[];
  description: string;
}

export interface FunctionalSubdomain {
  name: string;
  confidence: number;
  evidence: string[];
  description: string;
}

export interface ClosestBenchmark {
  name: string;
  owner: string;
  full_name: string;
  url: string;
  stars: number;
  source_tier: string;
  similarity_score: number;
  pattern: string;
}

export interface RecommendedDiagram {
  storage_url: string;
  original_url: string;
  diagram_type: string;
  caption: string;
  reliability_score: number;
}

export interface LayerDistribution {
  presentation: number;
  business_logic: number;
  persistence: number;
  infrastructure: number;
}

export interface AnalysisStatistics {
  layer_distribution: LayerDistribution;
  pattern_adherence_score: number;
  modularity_index: number;
  coupling_risk: string;
  maintainability_rating: string;
}

export interface ComparisonStatistics {
  input_stats: AnalysisStatistics;
  benchmark_stats: AnalysisStatistics;
  delta_adherence: number;
  delta_modularity: number;
  summary: string;
}

export interface FlowCorrection {
  title: string;
  detected_gaps: string[];
  recommendations: string[];
  mermaid_code: string;
}

export interface PredictResult {
  top_pattern: string;
  confidence: number;
  top_candidates: Candidate[];
  rationale: string;
  source_tier_hint: string;
  technical_structure: TechnicalComponent[];
  functional_subdomains: FunctionalSubdomain[];
  architecture_reasoning: string;
  closest_match: ClosestBenchmark;
  recommended_diagram?: RecommendedDiagram | null;
  analysis_stats: AnalysisStatistics;
  comparison: ComparisonStatistics;
  flow_correction: FlowCorrection;
  model_info: string;
}
