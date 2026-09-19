/**
 * Centralized Adaptive Harvesting & Dataset Balancing Configuration
 * Configurable thresholds, urgency tiers, and water-filling allocation parameters.
 */

export interface TierConfig {
  name: string;
  maxShareRatio: number; // Ratio of actual proportion to target proportion (p_i / p_target)
  urgencyMultiplier: number;
  rationale: string;
}

export const ADAPTIVE_CONFIG = {
  // Percentage & Relative Proportion Thresholds (No arbitrary fixed numbers)
  // p_target = 1 / K (uniform share)
  // ratio = p_i / p_target
  PERCENTAGE_TIERS: {
    EMERGENCY: {
      name: "Tier 1: Emergency Deficit (Severe Minority)",
      maxShareRatio: 0.25, // < 25% of fair uniform share
      urgencyMultiplier: 5.0,
      rationale: "Extreme minority (< 25% of equilibrium share); high risk of model blindness.",
    },
    CRITICAL: {
      name: "Tier 2: Critical Deficit (Minority)",
      maxShareRatio: 0.60, // 25% - 60% of fair uniform share
      urgencyMultiplier: 3.0,
      rationale: "Underrepresented minority (25% - 60% of equilibrium share).",
    },
    DEVELOPING: {
      name: "Tier 3: Developing Deficit",
      maxShareRatio: 1.00, // 60% - 100% of fair uniform share
      urgencyMultiplier: 1.5,
      rationale: "Approaching equilibrium but still in deficit (60% - 100% of equilibrium share).",
    },
    USABLE: {
      name: "Tier 4: Balanced / Usable",
      maxShareRatio: 1.30, // 100% - 130% of fair uniform share
      urgencyMultiplier: 0.5,
      rationale: "Balanced content level; minimal harvesting needed.",
    },
    SATURATED: {
      name: "Tier 5: Saturated (Harvesting Stopped)",
      maxShareRatio: Infinity, // >= 130% of fair uniform share
      urgencyMultiplier: 0.0, // Strictly 0 quota: paused
      rationale: "Exceeds saturation content level (> 130% of equilibrium share); permanently paused.",
    },
  },

  // Saturation threshold multiplier above uniform share (1.3x = 130%)
  SATURATION_SHARE_RATIO: 1.30,

  // Architecture Evidence Safety Gate thresholds
  MIN_EVIDENCE_SCORE: 0.40,
  MIN_TOTAL_FILES: 4,

  // Water-Filling Batch Allocation Limits
  EXECUTION_SPLIT: {
    TIER_1_2_SHARE: 0.85, // 85% of harvest capacity strictly reserved for Emergency/Critical minorities
    TIER_3_4_SHARE: 0.15, // 15% for Developing deficits
    TIER_5_SHARE: 0.00,   // Strictly 0% for Saturated categories
  },

  MAX_PAGES_PER_QUERY: 4,
  DEFAULT_BATCH_SIZE: 50,
};

export const VALID_PROGRAMMING_LANGUAGES = new Set([
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "Kotlin",
  "C#",
  "C++",
  "PHP",
  "Ruby",
  "Swift",
  "Dart",
  "Scala",
  "Elixir",
]);

export const ARCHITECTURE_TOPIC_MAP: Record<string, string> = {
  "Microservices Architecture": "topic:microservices",
  "Domain-Driven Design (DDD)": "topic:ddd",
  "Clean Architecture": "topic:clean-architecture",
  "Hexagonal Architecture": "topic:hexagonal-architecture",
  "Event-Driven Architecture": "topic:event-driven",
  "CQRS & Event Sourcing": "topic:cqrs",
  "Serverless Architecture": "topic:serverless",
  "Modular Monolith Architecture": "topic:modular-monolith",
  "FastAPI Async Web Service": "topic:fastapi",
  "Spring Boot Layered": "topic:spring-boot",
  "NestJS Layered Enterprise": "topic:nestjs",
  "MVC Architecture": "topic:mvc",
};
