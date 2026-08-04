export interface RepositoryReadme {
    repositoryId: number;

    name: string;
    path: string;
    sha: string;

    url: string;
    htmlUrl: string | null;
    downloadUrl: string | null;
    size: number;
    encoding: "base64",

    content: string;
    fetchedAt: Date;

    source: "github";
}