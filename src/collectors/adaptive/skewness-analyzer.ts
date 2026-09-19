/**
 * Phase 1: Skewness & Symmetry Analyzer
 * Computes marginal & joint distributions, Normalized Shannon Entropy,
 * Gini-Simpson index, 5-tier urgency classification, and dynamic deficit weights.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { ADAPTIVE_CONFIG } from "./adaptive.config";

export type BucketStatus = "starved" | "balanced" | "saturated";

export interface BucketMetric {
    name: string;
    count: number;
    proportion: number;
    targetProportion: number;
    deficitRatio: number; // > 0 means underrepresented, < 0 means overrepresented
    priorityWeight: number; // Higher weight = higher harvesting priority
    status: BucketStatus;
    tierLevel: 1 | 2 | 3 | 4 | 5;
    tierName: string;
    urgencyMultiplier: number;
}

export interface SkewnessReport {
    analyzedAt: string;
    totalSamples: number;
    symmetryScore: number; // 0 to 100% (100% = perfectly balanced)
    metrics: {
        languageEntropy: number; // Normalized Shannon Entropy (0 to 1)
        languageGiniSimpson: number; // Gini-Simpson Diversity Index (0 to 1)
        architectureEntropy: number; // Normalized Shannon Entropy (0 to 1)
        architectureGiniSimpson: number; // Gini-Simpson Diversity Index (0 to 1)
    };
    starvedCategories: {
        languages: BucketMetric[];
        architectures: BucketMetric[];
    };
    saturatedCategories: {
        languages: BucketMetric[];
        architectures: BucketMetric[];
    };
    languageDistribution: BucketMetric[];
    architectureDistribution: BucketMetric[];
}

export class SkewnessAnalyzer {
    private static readonly EPSILON = 1e-9;

    /**
     * Classifies relative share ratio (p_i / p_target) into 5-tier operational urgency system.
     * Purely percentage and percentile based, avoiding fixed numerical counts.
     */
    public static classifyTier(proportion: number, targetProportion: number): {
        tierLevel: 1 | 2 | 3 | 4 | 5;
        tierName: string;
        urgencyMultiplier: number;
    } {
        const { PERCENTAGE_TIERS } = ADAPTIVE_CONFIG;
        const shareRatio = targetProportion > 0 ? proportion / targetProportion : 1.0;

        if (shareRatio < PERCENTAGE_TIERS.EMERGENCY.maxShareRatio) {
            return { tierLevel: 1, tierName: PERCENTAGE_TIERS.EMERGENCY.name, urgencyMultiplier: PERCENTAGE_TIERS.EMERGENCY.urgencyMultiplier };
        }
        if (shareRatio < PERCENTAGE_TIERS.CRITICAL.maxShareRatio) {
            return { tierLevel: 2, tierName: PERCENTAGE_TIERS.CRITICAL.name, urgencyMultiplier: PERCENTAGE_TIERS.CRITICAL.urgencyMultiplier };
        }
        if (shareRatio < PERCENTAGE_TIERS.DEVELOPING.maxShareRatio) {
            return { tierLevel: 3, tierName: PERCENTAGE_TIERS.DEVELOPING.name, urgencyMultiplier: PERCENTAGE_TIERS.DEVELOPING.urgencyMultiplier };
        }
        if (shareRatio < PERCENTAGE_TIERS.USABLE.maxShareRatio) {
            return { tierLevel: 4, tierName: PERCENTAGE_TIERS.USABLE.name, urgencyMultiplier: PERCENTAGE_TIERS.USABLE.urgencyMultiplier };
        }
        return { tierLevel: 5, tierName: PERCENTAGE_TIERS.SATURATED.name, urgencyMultiplier: PERCENTAGE_TIERS.SATURATED.urgencyMultiplier };
    }

    /**
     * Calculates distribution metrics and deficit weights from a frequency record.
     * @param counts Map of category name to count
     * @param total Total number of samples
     * @param gamma Deficit sensitivity exponent (default 1.2)
     * @param alpha Count penalty exponent (default 0.5)
     */
    public static analyzeDimension(
        counts: Record<string, number>,
        total: number,
        gamma = 1.2,
        alpha = 0.5
    ): {
        metrics: BucketMetric[];
        entropy: number;
        giniSimpson: number;
    } {
        const keys = Object.keys(counts);
        const K = keys.length;

        if (K === 0 || total === 0) {
            return { metrics: [], entropy: 0, giniSimpson: 0 };
        }

        const targetProportion = 1 / K;

        // 1. Calculate Shannon Entropy: H = -sum(p_i * ln(p_i))
        // Normalized Shannon Entropy: H_norm = H / ln(K)
        let sumPLogP = 0;
        let sumPSquared = 0;

        const metrics: BucketMetric[] = keys.map((name) => {
            const count = counts[name] ?? 0;
            const proportion = count / total;

            if (proportion > 0) {
                sumPLogP += proportion * Math.log(proportion + this.EPSILON);
                sumPSquared += proportion * proportion;
            }

            // Deficit: how far below target proportion (relative to target)
            const deficitRatio = (targetProportion - proportion) / targetProportion;
            const tier = this.classifyTier(proportion, targetProportion);

            // Water-Filling priority weight incorporates tier urgency multiplier
            // If category is saturated (Tier 5), its priority weight is strictly 0!
            const positiveDeficit = Math.max(0, deficitRatio);
            const priorityWeight =
                positiveDeficit > 0 && tier.tierLevel < 5
                    ? Math.pow(positiveDeficit, gamma) * (1 / Math.pow(count + 1, alpha)) * tier.urgencyMultiplier
                    : 0;

            // Classify status based on percentage tiers
            let status: BucketStatus = "balanced";
            if (tier.tierLevel <= 2) {
                status = "starved";
            } else if (tier.tierLevel === 5) {
                status = "saturated";
            }

            return {
                name,
                count,
                proportion: Number(proportion.toFixed(4)),
                targetProportion: Number(targetProportion.toFixed(4)),
                deficitRatio: Number(deficitRatio.toFixed(4)),
                priorityWeight: Number(priorityWeight.toFixed(6)),
                status,
                tierLevel: tier.tierLevel,
                tierName: tier.tierName,
                urgencyMultiplier: tier.urgencyMultiplier,
            };
        });

        const H = -sumPLogP;
        const maxH = Math.log(K);
        const entropy = maxH > 0 ? Math.min(1.0, Math.max(0, H / maxH)) : 1.0;
        const giniSimpson = Math.max(0, 1 - sumPSquared);

        // Sort by priority weight descending
        metrics.sort((a, b) => b.priorityWeight - a.priorityWeight);

        return { metrics, entropy, giniSimpson };
    }

    /**
     * Computes comprehensive dataset skewness and balance score.
     */
    public static computeReport(
        languageCounts: Record<string, number>,
        architectureCounts: Record<string, number>,
        total: number
    ): SkewnessReport {
        const langAnalysis = this.analyzeDimension(languageCounts, total);
        const archAnalysis = this.analyzeDimension(architectureCounts, total);

        // Composite Symmetry Index (0 to 100%)
        // Balances normalized language entropy & architecture entropy
        const avgEntropy = (langAnalysis.entropy + archAnalysis.entropy) / 2;
        const avgGini = (langAnalysis.giniSimpson + archAnalysis.giniSimpson) / 2;

        // Monotonic symmetry score bounded in [0, 100]
        const symmetryScore = Number((avgEntropy * Math.min(1.0, avgGini * 1.05) * 100).toFixed(1));

        return {
            analyzedAt: new Date().toISOString(),
            totalSamples: total,
            symmetryScore,
            metrics: {
                languageEntropy: Number(langAnalysis.entropy.toFixed(4)),
                languageGiniSimpson: Number(langAnalysis.giniSimpson.toFixed(4)),
                architectureEntropy: Number(archAnalysis.entropy.toFixed(4)),
                architectureGiniSimpson: Number(archAnalysis.giniSimpson.toFixed(4)),
            },
            starvedCategories: {
                languages: langAnalysis.metrics.filter((m) => m.status === "starved"),
                architectures: archAnalysis.metrics.filter((m) => m.status === "starved"),
            },
            saturatedCategories: {
                languages: langAnalysis.metrics.filter((m) => m.status === "saturated"),
                architectures: archAnalysis.metrics.filter((m) => m.status === "saturated"),
            },
            languageDistribution: langAnalysis.metrics,
            architectureDistribution: archAnalysis.metrics,
        };
    }

    /**
     * Helper to load and analyze directly from the dataset summary.
     */
    public static async analyzeFromSummary(
        summaryPath = "data/model_ready/dataset_summary.json"
    ): Promise<SkewnessReport> {
        const absPath = path.resolve(summaryPath);
        const raw = await fs.readFile(absPath, "utf-8");
        const summary = JSON.parse(raw);

        const total = summary.cleanedSamplesCount ?? summary.totalHarvestedRepos ?? 0;
        const langCounts = summary.languageDistribution ?? {};
        const archCounts = summary.architecturePatternsDistribution ?? {};

        return this.computeReport(langCounts, archCounts, total);
    }
}
