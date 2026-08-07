import { AssetResult } from "../services/assets";

export interface Repository {
    // Basic Information
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;

    stars: number;
    forks: number;
    language: string | null;
    defaultBranch: string;

    owner: {
        login: string;
        avatarUrl: string;
        profileUrl: string;
    };

    source: "github" | "kaggle";

    topics: string[];

    createdAt: string | null;
    updatedAt: string | null;

    // Collected Data
    readme?: {
        content: string;
        sha?: string;
        size?: number;
    };

    images?: AssetResult[];

    diagrams?: AssetResult[];
}
