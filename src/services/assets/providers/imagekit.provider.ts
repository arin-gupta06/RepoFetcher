import ImageKit from "imagekit";

import {
    AssetProvider,
    UploadAsset,
    UploadRequest,
} from "../asset.interface";

export class ImageKitProvider implements AssetProvider {
    public static readonly providerName = "imagekit";
    

    private readonly client: ImageKit;

    constructor() {
        const {
            IMAGEKIT_PUBLIC_KEY,
            IMAGEKIT_PRIVATE_KEY,
            IMAGEKIT_URL_ENDPOINT,
        } = process.env;

        if (
            !IMAGEKIT_PUBLIC_KEY ||
            !IMAGEKIT_PRIVATE_KEY ||
            !IMAGEKIT_URL_ENDPOINT
        ) {
            throw new Error(
                "ImageKit environment variables are not configured."
            );
        }

        this.client = new ImageKit({
            publicKey: IMAGEKIT_PUBLIC_KEY,
            privateKey: IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: IMAGEKIT_URL_ENDPOINT,
        });
    }

    public async upload(
        request: UploadRequest
    ): Promise<UploadAsset> {

        try {

            const response = await this.client.upload({
                file: request.file,
                fileName: request.fileName,
                folder: request.folder,
            });

            console.log("ImageKit Response:", response);

            return {
                provider: ImageKitProvider.providerName,
                fileId: response.fileId,
                fileName: response.name,
                storageUrl: response.url,
            };

        } catch (error) {

            console.error("ImageKit Upload Error:");

            console.error(error);

            throw error;
        }
    }
}