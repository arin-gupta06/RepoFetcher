import type { Repository } from "../../models/repository.model";

export async function collectRepositoryImages(
  repository: Repository,
): Promise<Repository> {
  return repository;
}
