export interface DependencyManifest {
    filename: string;
    frameworkDetected: string[];
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
}

export interface DirectoryLayerMatch {
    layerName: string;
    matchPaths: string[];
}
export interface StructuralFingerprint {
    repositoryId: number;
    repositoryFullName: string;
    defaultBranch: string;
    entryPoints: string[];
    manifests: DependencyManifest[];
    detectedLayers: DirectoryLayerMatch[];
    totalFiles: number;
    totalDirectories: number;
    collectedAt: Date;
}