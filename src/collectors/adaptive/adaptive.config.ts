/**
 * Centralized Adaptive Harvesting & Dataset Balancing Configuration
 * Configurable thresholds, urgency tiers, and water-filling allocation parameters.
 */

export interface TierConfig {
  name: string;
  maxCount: number;
  urgencyMultiplier: number;
  rationale: string;
}

export const ADAPTIVE_CONFIG = {
  // 5-Tier Urgency Thresholds (based on existing sample counts)
  TIERS: {
    EMERGENCY: {
      name: "Tier 1: Emergency Deficit",
      maxCount: 5,
      urgencyMultiplier: 5.0,
      rationale: "Extreme data starvation (< 5 samples); risk of model blindness.",
    },
    CRITICAL: {
      name: "Tier 2: Critical Deficit",
      maxCount: 15,
      urgencyMultiplier: 3.0,
      rationale: "Under minimum threshold for reliable cross-validation (5-14 samples).",
    },
    DEVELOPING: {
      name: "Tier 3: Developing Deficit",
      maxCount: 30,
      urgencyMultiplier: 1.8,
      rationale: "Present but underrepresented (15-29 samples).",
    },
    USABLE: {
      name: "Tier 4: Usable Representation",
      maxCount: 60,
      urgencyMultiplier: 1.0,
      rationale: "Adequate baseline representation (30-59 samples).",
    },
    SATURATED: {
      name: "Tier 5: Saturated",
      maxCount: Infinity,
      urgencyMultiplier: 0.0, // Frozen/paused: 0% quota
      rationale: "Over-represented (60+ samples); paused to prevent dataset skew.",
    },
  },

  // Target equilibrium per valid programming language and architecture pattern
  TARGET_PER_BUCKET: 60,

  // Architecture Evidence Safety Gate thresholds
  MIN_EVIDENCE_SCORE: 0.40,
  MIN_TOTAL_FILES: 4,

  // Water-Filling Batch Allocation Limits
  EXECUTION_SPLIT: {
    TIER_1_2_SHARE: 0.75, // At least 75% of capacity reserved for Emergency/Critical
    TIER_3_4_SHARE: 0.25, // Remaining 25% for Developing/Usable
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
