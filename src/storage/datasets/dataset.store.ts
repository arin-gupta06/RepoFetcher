import type { Dataset } from "../../models/datasets.models";

export class DatasetStore {
  private readonly datasets = new Map<string, Dataset>();

  addMany(datasets: Dataset[]): void {
    for (const dataset of datasets) {
      this.datasets.set(dataset.id, dataset);
    }
  }

  getAll(): Dataset[] {
    return Array.from(this.datasets.values());
  }
}
