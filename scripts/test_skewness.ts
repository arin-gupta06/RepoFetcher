import { SkewnessAnalyzer } from "../src/collectors/adaptive/skewness-analyzer";
import { AdaptiveQueryGenerator } from "../src/collectors/adaptive/adaptive-query-generator";

async function main() {
    console.log("Testing Tiered Water-Filling Skewness Analyzer & Adaptive Query Generator...\n");

    const report = await SkewnessAnalyzer.analyzeFromSummary();

    console.log("==================================================");
    console.log(`📊 Symmetry Score: ${report.symmetryScore}%`);
    console.log(`Language Entropy:     ${report.metrics.languageEntropy} (Gini-Simpson: ${report.metrics.languageGiniSimpson})`);
    console.log(`Architecture Entropy: ${report.metrics.architectureEntropy} (Gini-Simpson: ${report.metrics.architectureGiniSimpson})`);
    console.log("==================================================");

    console.log(`\n🚨 Starved Languages (${report.starvedCategories.languages.length}):`);
    report.starvedCategories.languages.slice(0, 6).forEach((l) => {
        console.log(`   - [${l.tierName}] ${l.name.padEnd(12)}: ${l.count} repos (Deficit: ${(l.deficitRatio * 100).toFixed(1)}%, Priority: ${l.priorityWeight})`);
    });

    console.log(`\n🚨 Starved Architectures (${report.starvedCategories.architectures.length}):`);
    report.starvedCategories.architectures.slice(0, 6).forEach((a) => {
        console.log(`   - [${a.tierName}] ${a.name.padEnd(30)}: ${a.count} repos (Deficit: ${(a.deficitRatio * 100).toFixed(1)}%, Priority: ${a.priorityWeight})`);
    });

    console.log("\n🎯 Top 5 Generated Water-Filling Harvest Queries (Batch = 50 repos):");
    const queries = AdaptiveQueryGenerator.generateHarvestPlan(report, 5, 50);
    queries.forEach((q, idx) => {
        console.log(`   ${idx + 1}. [${q.tierName}] Quota: ${q.targetQuota} repos | Priority: ${q.priorityScore}`);
        console.log(`      Query: "${q.query}" (maxPages: ${q.maxPages})`);
        console.log(`      Rationale: ${q.rationale}`);
    });
}

main().catch(console.error);
