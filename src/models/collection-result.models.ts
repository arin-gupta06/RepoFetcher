import type { Repository } from "./repository.models";
import type { Dataset } from "./datasets.models";
import { RepositoryReadme } from "./readme.models";

export interface CollectionResult {
    repositories: Repository[];
    datasets: Dataset[];
    readmes: RepositoryReadme[];
}