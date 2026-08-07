import { AssetFactory } from "./asset.factory";
import { assetProviders } from "./providers";

assetProviders.forEach((provider) => {
    AssetFactory.register(provider);
});

export * from "./asset.interface";
export * from "./asset.factory";
export * from "./asset.service";