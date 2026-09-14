import type { AssetResult, SourceTier } from "../services/assets/asset.interface";
import type { ArchitectureDoc } from "./architecture-doc.models";
import type { StructuralFingerprint } from "./structural-fingerprint.models";

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

    source: "github" | "kaggle" | "curated";
    sourceTier: SourceTier;

    topics: string[];

    createdAt: string | null;
    updatedAt: string | null;

    // Collected Data
    readme?: {
        content: string;
        sha?: string;
        size?: number;
    };
    architectureDocs?: ArchitectureDoc[];
    fingerprint?: StructuralFingerprint;

    images?: AssetResult[];

    diagrams?: AssetResult[];
}
