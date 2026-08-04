import type { Repository } from "../../models/repository.model";

export async function collectRepositoryDiagrams(
  repository: Repository,
): Promise<Repository> {
  return repository;
}
