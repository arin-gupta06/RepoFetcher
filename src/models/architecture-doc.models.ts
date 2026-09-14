export interface ArchitectureDoc {
    repositoryId: number;
    repositoryFullName: string;
    path: string;
    filename: string;
    headings: string[];
    content: string;
    size: number;
    sha: string;
    sourceUrl: string;
    fetchedAt: Date;
}