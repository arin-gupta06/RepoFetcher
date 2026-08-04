import type { Repository } from "../../models/repository.model";

export async function collectRepositoryReadme(
  repository: Repository,
): Promise<Repository> {
  return repository;
}
