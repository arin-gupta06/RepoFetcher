import { runHarvestingPipeline } from "./collectors/collector.manager";
import { collectionStatistics } from "./statistics/collection.statistics";

async function main() {
  console.log("==========================================");
  console.log("   RepoFetcher for RepoLens Pipeline      ");
  console.log("==========================================");

  try {
    await runHarvestingPipeline();
    console.log("\n✅ Harvesting completed successfully!");
  } catch (error) {
    console.error("\n❌ Pipeline error:", error);
  } finally {
    collectionStatistics.printSummary();
  }
}

main();
