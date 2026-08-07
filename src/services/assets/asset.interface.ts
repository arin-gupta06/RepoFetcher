export interface AssetRequest {
    repositoryId: number;
    repositoryName: string;

    url: string;
    type: "image" | "diagram";
}

export interface AssetMetadata {
    width: number;
    height: number;

    size: number;

    mimeType: string;
    extension: string;

    hash: string;
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

    uploadedAsset: UploadAsset;
    metadata: AssetMetadata;
}

export interface AssetProvider {
    upload (
        request: UploadRequest
    ): Promise <UploadAsset>;
}
export type AssetProviderConstructor = {
    new (): AssetProvider;
    readonly providerName: string;
};
