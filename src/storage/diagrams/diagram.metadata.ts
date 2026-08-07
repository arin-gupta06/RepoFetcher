import type { CorpusMetadata } from "../corpus.metadata";

export interface DiagramMetadata extends CorpusMetadata {
    repositoryId: string;

    path: string;

    filename: string;

    extension: string;

    size: number;

    width: number;

    height: number;

    sha256: string;

    diagramType?:
        | "architecture"
        | "flowchart"
        | "sequence"
        | "uml"
        | "erd"
        | "deployment"
        | "pipeline"
        | "unknown";

    source:
        | "github"
        | "official-docs"
        | "paper";
}
