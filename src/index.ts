import { runHarvestingPipeline, runAdaptiveHarvestingPipeline } from "./collectors/collector.manager";
import { collectionStatistics } from "./statistics/collection.statistics";

function parseArgs(): { mode: string; batchSize: number; cycles: number } {
  const args = process.argv.slice(2);
  let mode = process.env.HARVEST_MODE ?? "adaptive";
  let batchSize = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE, 10) : 50;
  let cycles = process.env.CYCLES ? parseInt(process.env.CYCLES, 10) : 1;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--mode" && i + 1 < args.length) {
      mode = args[++i];
    } else if (arg.startsWith("--mode=")) {
      mode = arg.split("=")[1];
    } else if ((arg === "--batch" || arg === "-b") && i + 1 < args.length) {
      batchSize = parseInt(args[++i], 10);
    } else if (arg.startsWith("--batch=")) {
      batchSize = parseInt(arg.split("=")[1], 10);
    } else if ((arg === "--cycles" || arg === "-c") && i + 1 < args.length) {
      cycles = parseInt(args[++i], 10);
    } else if (arg.startsWith("--cycles=")) {
      cycles = parseInt(arg.split("=")[1], 10);
    }
  }

  return {
    mode,
    batchSize: isNaN(batchSize) || batchSize <= 0 ? 50 : batchSize,
    cycles: isNaN(cycles) || cycles <= 0 ? 1 : cycles,
  };
}

async function main() {
  const { mode, batchSize, cycles } = parseArgs();

  console.log("==========================================");
  console.log(`   RepoFetcher for RepoLens Pipeline      `);
  console.log(`   Mode:        ${mode.toUpperCase()}`);
  console.log(`   Batch Size:  ${batchSize} repos/cycle`);
  console.log(`   Cycles:      ${cycles}`);
  console.log("==========================================");

  try {
    if (mode.toLowerCase() === "adaptive") {
      for (let c = 1; c <= cycles; c++) {
        if (cycles > 1) {
          console.log(`\n🔄 [Cycle ${c} of ${cycles}] Starting adaptive balance run...`);
        }
        await runAdaptiveHarvestingPipeline({
          maxReposPerBatch: batchSize,
          maxQueries: Math.max(15, Math.ceil(batchSize / 3)),
        });
      }
    } else {
      await runHarvestingPipeline();
    }
    console.log("\n✅ All harvesting cycles completed successfully!");
  } catch (error) {
    console.error("\n❌ Pipeline error:", error);
  } finally {
    collectionStatistics.printSummary();
  }
}

main();
