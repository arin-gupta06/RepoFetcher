import { UploadAsset, UploadRequest, AssetProvider } from "../asset.interface";

export class GitHubProvider implements AssetProvider {
    public static readonly providerName = "github";

    public async upload(
        request: UploadRequest
    ): Promise<UploadAsset> {
        throw new Error(
            "GitHub provider is not implemented."
        );
    }
}