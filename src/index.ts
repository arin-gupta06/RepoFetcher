import { collectResources } from "./collectors/collector.manager";
import { appendToJson } from "./storage/json.exporter";
import { RepositoryStore } from "./storage/repositories";
import { DatasetStore } from "./storage/datasets";
import { previewDatasets, previewRepositories } from "./utils/preview";
import { ReadmeStore } from "./storage/readmes";
import { collectionStatistics } from "./statistics/collection.statistics";

async function main() {
  const { repositories, datasets, readmes } = await collectResources();

  const repositoryStore = new RepositoryStore();
  const datasetStore = new DatasetStore();
  const readmeStore = new ReadmeStore();

  repositoryStore.addMany(repositories);
  datasetStore.addMany(datasets);
  readmeStore.addMany(readmes)

  await appendToJson(
    repositoryStore.getAll(),
    "repositories.json",
    (repository) => repository.id,
  );
  await appendToJson(
    datasetStore.getAll(),
    "datasets.json",
    (dataset) => dataset.id,
  );
  await appendToJson(
    readmeStore.getAll(),
    "readmes.json",
    (readme) => readme.repositoryId,
  );

  console.log(`Fetched ${repositoryStore.getAll().length} repositories.`);
  console.log(`Fetched ${datasetStore.getAll().length} datasets.`);
  previewRepositories(repositories);
  previewDatasets(datasets);
  collectionStatistics.printSummary();
}

main();
