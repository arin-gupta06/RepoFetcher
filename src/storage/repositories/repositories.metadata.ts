import type { CorpusMetadata } from "../corpus.metadata";

export interface RepositoryMetadata extends CorpusMetadata {
    // Identity
    owner: string;
    name: string;
    fullName: string;
    url: string;

    // GitHub
    defaultBranch: string;
    visibility: "public" | "private";
    archived: boolean;
    fork: boolean;

    // Repository Info
    description?: string;
    primaryLanguage?: string;
    topics: string[];
    license?: string;

    // Statistics
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;

    // Timeline
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
}
