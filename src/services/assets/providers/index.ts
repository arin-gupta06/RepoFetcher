import { AssetProviderConstructor } from "../asset.interface";

import { ImageKitProvider } from "./imagekit.provider";
import { CloudinaryProvider } from "./cloudinary.provider";
import { GitHubProvider } from "./github.provider";

export const assetProviders: AssetProviderConstructor[] = [
    ImageKitProvider,
    CloudinaryProvider,
    GitHubProvider,
];