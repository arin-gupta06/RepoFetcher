import type { CorpusMetadata } from "../corpus.metadata";

export interface ImageMetadata extends CorpusMetadata {
    repositoryId: string;

    path: string;

    filename: string;

    extension: string;

    mimeType: string;

    size: number;

    width: number;

    height: number;

    aspectRatio: number;

    sha256: string;

    perceptualHash?: string;

    source:
        | "github"
        | "official-docs"
        | "paper"
        | "blog";
}
