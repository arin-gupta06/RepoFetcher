import type { Repository } from "../models/repository.models";
import type { Dataset } from "../models/datasets.models";

export function previewRepositories(repositories: Repository[]): void {
  console.log(`Repositories: ${repositories.length}`);

  console.table(
    repositories.slice(0, 10).map((repo) => ({
      Name: repo.name,
      Owner: repo.owner.login,
      Language: repo.language,
      Stars: repo.stars,
      Forks: repo.forks,
    }))
  );
}

export function previewDatasets(datasets: Dataset[]): void {
  console.log(`Datasets: ${datasets.length}`);

  console.table(
    datasets.slice(0, 10).map((dataset) => ({
      Title: dataset.title,
      Owner: dataset.owner.username,
      Downloads: dataset.downloads,
      Votes: dataset.votes,
    }))
  );
}