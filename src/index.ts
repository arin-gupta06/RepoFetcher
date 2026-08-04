import { collectRepositories } from "./collectors/collector.manager";
import { exportRepositoriesToJson } from "./storage/json.exporter";
import { RepositoryStore } from "./storage/repository.store";

async function main() {
  const repositories = await collectRepositories();
  const store = new RepositoryStore();

  store.addMany(repositories);
  await exportRepositoriesToJson(store.getAll(), "repositories.json");

  console.log(`Fetched ${store.getAll().length} repositories.`);
}

main();
