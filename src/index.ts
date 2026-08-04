import { collectResources } from "./collectors/collector.manager";
import { exportToJson } from "./storage/json.exporter";
import { RepositoryStore } from "./storage/repository.store";
import { DatasetStore } from "./storage/dataset.store";
import { previewDatasets, previewRepositories } from "./utils/preview";
import { ReadmeStore } from "./storage/readme.store";
async function main() {
  const { repositories, datasets, readmes } = await collectResources();

  const repositoryStore = new RepositoryStore();
  const datasetStore = new DatasetStore();
  const readmeStore = new ReadmeStore();

  repositoryStore.addMany(repositories);
  datasetStore.addMany(datasets);
  readmeStore.addMany(readmes)

  await exportToJson(repositoryStore.getAll(), "repositories.json");
  await exportToJson(datasetStore.getAll(), "datasets.json");
  await exportToJson(readmeStore.getAll(), "readmes.json");

  console.log(`Fetched ${repositoryStore.getAll().length} repositories.`);
  console.log(`Fetched ${datasetStore.getAll().length} datasets.`);
  previewRepositories(repositories);
  previewDatasets(datasets);
}

main();