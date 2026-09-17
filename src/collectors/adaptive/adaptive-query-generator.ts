/**
 * Phase 1: Adaptive Query Generator with Tiered Water-Filling Quota Allocation
 * Dynamically constructs multi-dimensional GitHub queries targeting
 * starved language × architecture intersections, assigning mathematically derived quotas.
 */

import { type SkewnessReport, type BucketMetric } from "./skewness-analyzer";
import {
  ADAPTIVE_CONFIG,
  ARCHITECTURE_TOPIC_MAP,
  VALID_PROGRAMMING_LANGUAGES,
} from "./adaptive.config";

export interface AdaptiveHarvestQuery {
  query: string;
  targetLanguage?: string;
  targetArchitecture?: string;
  priorityScore: number;
  tierLevel: 1 | 2 | 3 | 4 | 5;
  tierName: string;
  targetQuota: number; // Dynamically allocated repository harvest quota for this query
  maxPages: number;
  rationale: string;
}

export class AdaptiveQueryGenerator {
  /**
   * Generates a prioritized list of targeted GitHub queries using Tiered Water-Filling.
   * @param report Current Skewness Report
   * @param maxQueries Maximum number of unique queries to generate
   * @param batchSize Total batch capacity (default 50)
   */
  public static generateHarvestPlan(
    report: SkewnessReport,
    maxQueries = 25,
    batchSize = ADAPTIVE_CONFIG.DEFAULT_BATCH_SIZE
  ): AdaptiveHarvestQuery[] {
    const rawCandidates: Array<{
      query: string;
      targetLanguage?: string;
      targetArchitecture?: string;
      priorityScore: number;
      tierLevel: 1 | 2 | 3 | 4 | 5;
      tierName: string;
      rationale: string;
    }> = [];
    const seenQueries = new Set<string>();

    const starvedLangs = report.starvedCategories.languages;
    const starvedArchs = report.starvedCategories.architectures;

    // 1. Cross-Product Joint Targeting: Pair Starved Languages with Starved Architectures
    for (const arch of starvedArchs) {
      const topic = ARCHITECTURE_TOPIC_MAP[arch.name];
      if (!topic) continue;

      for (const lang of starvedLangs) {
        if (!VALID_PROGRAMMING_LANGUAGES.has(lang.name)) continue;

        const q = `${topic} language:${lang.name} stars:>30`;
        if (seenQueries.has(q)) continue;
        seenQueries.add(q);

        // Highest tier of the pair determines urgency
        const minTierLevel = Math.min(arch.tierLevel, lang.tierLevel) as 1 | 2 | 3 | 4 | 5;
        const urgencyMult = Math.max(arch.urgencyMultiplier, lang.urgencyMultiplier);
        const jointDeficit = Math.max(1, ADAPTIVE_CONFIG.TARGET_PER_BUCKET - Math.min(arch.count, lang.count));
        const priority = Number((urgencyMult * jointDeficit * 2.5).toFixed(2));

        rawCandidates.push({
          query: q,
          targetLanguage: lang.name,
          targetArchitecture: arch.name,
          priorityScore: priority,
          tierLevel: minTierLevel,
          tierName: `Joint ${minTierLevel === 1 ? "Tier 1: Emergency" : "Tier 2: Critical"}`,
          rationale: `Cross-targeted Water-Filling for starved pair: ${lang.name} (${lang.count} repos) + ${arch.name} (${arch.count} repos)`,
        });
      }
    }

    // 2. Pure Starved Architecture Targeting (Broad cross-language)
    for (const arch of starvedArchs) {
      const topic = ARCHITECTURE_TOPIC_MAP[arch.name];
      if (!topic) continue;

      const q = `${topic} stars:>80`;
      if (!seenQueries.has(q)) {
        seenQueries.add(q);
        const deficit = Math.max(1, ADAPTIVE_CONFIG.TARGET_PER_BUCKET - arch.count);
        const priority = Number((arch.urgencyMultiplier * deficit * 1.8).toFixed(2));

        rawCandidates.push({
          query: q,
          targetArchitecture: arch.name,
          priorityScore: priority,
          tierLevel: arch.tierLevel,
          tierName: arch.tierName,
          rationale: `Water-Filling architecture boost for: ${arch.name} (${arch.count} repos, deficit: ${(arch.deficitRatio * 100).toFixed(0)}%)`,
        });
      }
    }

    // 3. Pure Starved Language Targeting (Curated programming stacks only)
    for (const lang of starvedLangs) {
      if (!VALID_PROGRAMMING_LANGUAGES.has(lang.name)) continue;

      const q = `language:${lang.name} stars:300..5000`;
      if (!seenQueries.has(q)) {
        seenQueries.add(q);
        const deficit = Math.max(1, ADAPTIVE_CONFIG.TARGET_PER_BUCKET - lang.count);
        const priority = Number((lang.urgencyMultiplier * deficit * 1.2).toFixed(2));

        rawCandidates.push({
          query: q,
          targetLanguage: lang.name,
          priorityScore: priority,
          tierLevel: lang.tierLevel,
          tierName: lang.tierName,
          rationale: `Language pool deficit intake for: ${lang.name} (${lang.count} repos, deficit: ${(lang.deficitRatio * 100).toFixed(0)}%)`,
        });
      }
    }

    // Sort all raw candidates by priority descending (Tier 1 first)
    rawCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
    const selected = rawCandidates.slice(0, maxQueries);

    if (selected.length === 0) return [];

    // 4. Deficit-Weighted Water-Filling Quota Distribution
    // Tier 1/2 receive 75% of batch, Tier 3/4 receive 25%
    const tier12Candidates = selected.filter((q) => q.tierLevel <= 2);
    const tier34Candidates = selected.filter((q) => q.tierLevel > 2 && q.tierLevel < 5);

    const tier12Capacity = Math.round(batchSize * ADAPTIVE_CONFIG.EXECUTION_SPLIT.TIER_1_2_SHARE);
    const tier34Capacity = batchSize - tier12Capacity;

    const sumPriorities12 = tier12Candidates.reduce((acc, q) => acc + q.priorityScore, 0) || 1;
    const sumPriorities34 = tier34Candidates.reduce((acc, q) => acc + q.priorityScore, 0) || 1;

    const queries: AdaptiveHarvestQuery[] = [];

    for (const c of selected) {
      let allocatedQuota = 1;
      if (c.tierLevel <= 2) {
        allocatedQuota = Math.max(1, Math.round((c.priorityScore / sumPriorities12) * tier12Capacity));
      } else if (c.tierLevel < 5) {
        allocatedQuota = Math.max(1, Math.round((c.priorityScore / sumPriorities34) * tier34Capacity));
      } else {
        allocatedQuota = 0; // Saturated
      }

      const maxPages = Math.min(
        ADAPTIVE_CONFIG.MAX_PAGES_PER_QUERY,
        Math.max(1, Math.ceil(allocatedQuota / 15))
      );

      queries.push({
        ...c,
        targetQuota: allocatedQuota,
        maxPages,
      });
    }

    return queries;
  }
}
