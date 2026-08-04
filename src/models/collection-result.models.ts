import type { Repository } from "./repository.model";
import type { Dataset } from "./datasets.models";
import { RepositoryReadme } from "./readme.models";

export interface CollectionResult {
    repositories: Repository[];
    datasets: Dataset[];
    readmes: RepositoryReadme[];
}