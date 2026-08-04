import { RepositoryReadme } from "../models/readme.models";

export class ReadmeStore {
  private readonly readmes = new Map<number, RepositoryReadme>();

  add(readme: RepositoryReadme): void {
    this.readmes.set(readme.repositoryId, readme);
  }

  addMany(readmes: RepositoryReadme[]): void {
    for (const readme of readmes) {
      this.readmes.set(readme.repositoryId, readme);
    }
  }

  getAll(): RepositoryReadme[] {
    return Array.from(this.readmes.values());
  }
}