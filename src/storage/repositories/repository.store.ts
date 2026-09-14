import type { Repository } from "../../models/repository.models";

export class RepositoryStore {
  private readonly repositories = new Map<number, Repository>();

  addMany(repositories: Repository[]): void {
    for (const repository of repositories) {
      this.repositories.set(repository.id, repository);
    }
  }

  getAll(): Repository[] {
    return Array.from(this.repositories.values());
  }
}
