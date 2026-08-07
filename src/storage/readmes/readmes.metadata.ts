import type { CorpusMetadata } from "../corpus.metadata";

export interface ReadmeMetadata extends CorpusMetadata {
    repositoryId: string;

    repositoryName: string;

    path: string;

    branch: string;

    encoding: string;

    extension: ".md" | ".markdown" | ".rst" | string;

    size: number;

    sha256: string;
}
