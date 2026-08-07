import { UploadAsset, UploadRequest, AssetProvider } from "../asset.interface";

export class CloudinaryProvider implements AssetProvider {
    public static readonly providerName = "cloudinary";

    public async upload(
        request: UploadRequest
    ): Promise<UploadAsset> {
        throw new Error(
            "Cloudinary provider is not implemented."
        );
    }
}