import {
    AssetProvider,
    AssetProviderConstructor,
} from "./asset.interface";

export class AssetFactory {

    private static readonly registry =
        new Map<string, AssetProviderConstructor>();

    public static register(
        provider: AssetProviderConstructor
    ): void {
        this.registry.set(
            provider.providerName.toLowerCase(),
            provider
        );
    }

    public static create(name: string): AssetProvider {

        const Provider = this.registry.get(name.toLowerCase());

        if (!Provider) {
            throw new Error(
                `Provider '${name}' is not registered.`
            );
        }

        return new Provider();
    }
}