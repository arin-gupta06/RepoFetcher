import type { CorpusMetadata } from "../corpus.metadata";

export interface DatasetMetadata extends CorpusMetadata {
    repositoryId: string;

    name: string;

    path: string;

    extension: string;

    size: number;

    rows?: number;

    columns?: number;

    encoding?: string;

    compressed: boolean;

    hash: string;
}
