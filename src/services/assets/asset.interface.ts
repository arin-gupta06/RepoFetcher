export type SourceTier =
    | "tier_1_template"
    | "tier_2_official"
    | "tier_3_verified_oss"
    | "tier_4_public_pool"

export type DiagramType =
    | "architecture_diagram"
    | "flowchart"
    | "sequence_diagram"
    | "deployment_diagram"
    | "schema_diagram"
    | "ui_screenshot"
    | "noise";

export interface DiagramContext {
    sectionHeading: string | null;
    surroundingText: string | null;

    altText: string | null;
    isVectorCode: boolean;
    rawCode?: string;
}

export interface AssetRequest {
    repositoryId: number;
    repositoryName: string;
    url: string;
    type: "image" | "diagram";
    sourceTier?: SourceTier;
    context?: DiagramContext;
}

export interface AssetMetadata {
    width: number;
    height: number;

    size: number;

    mimeType: string;
    extension: string;

    hash: string;
    phash?: string;
}

export interface UploadAsset {
    provider: string;
    fileId: string;
    fileName: string;
    storageUrl: string;
}
export interface UploadRequest {
    file: Buffer;
    fileName: string;
    folder?: string;
}

export interface AssetResult {
    originalUrl: string;
    sourceTier: SourceTier;
    reliabilityScore: number;
    diagramType: DiagramType;
    context?: DiagramContext;

    uploadedAsset: UploadAsset;
    metadata: AssetMetadata;
}

export interface AssetProvider {
    upload(
        request: UploadRequest
    ): Promise<UploadAsset>;
}
export type AssetProviderConstructor = {
    new(): AssetProvider;
    readonly providerName: string;
};
