import type { DependencyManifest } from "../../models/structural-fingerprint.models";

const MANIFEST_FILES = [
    "package.json",
    "pom.xml",
    "go.mod",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
];

const FRAMEWORK_SIGNATURES: Record<string, string[]> = {
    NestJS: ["@nestjs/core", "@nestjs/common"],
    Express: ["express"],
    FastAPI: ["fastapi"],
    Django: ["django"],
    "Spring Boot": ["spring-boot-starter"],
    Gin: ["github.com/gin-gonic/gin"],
    Actix: ["actix-web"],
    TypeORM: ["typeorm"],
    Prisma: ["@prisma/client", "prisma"],
    SQLAlchemy: ["sqlalchemy"],
    Mongoose: ["mongoose"],
    Kafka: ["kafkajs", "confluent-kafka", "spring-kafka"],
    RabbitMQ: ["amqplib", "pika"],
};

export async function collectRepositoryManifests(
    owner: string,
    repo: string,
    branch: string
): Promise<DependencyManifest[]> {
    const manifests: DependencyManifest[] = [];

    for (const filename of MANIFEST_FILES) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`;

        try {
            const response = await fetch(rawUrl);
            if (!response.ok) continue;

            const content = await response.text();
            const manifest = parseManifest(filename, content);
            if (manifest) {
                manifests.push(manifest);
            }
        } catch {
            // Non-fatal: repo simply might not use this manifest
        }
    }

    return manifests;
}

function parseManifest(
    filename: string,
    content: string
): DependencyManifest | null {
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};

    if (filename === "package.json") {
        try {
            const json = JSON.parse(content);
            Object.assign(dependencies, json.dependencies ?? {});
            Object.assign(devDependencies, json.devDependencies ?? {});
        } catch {
            return null;
        }
    } else {
        // Basic flat extraction for non-json manifests
        const lines = content.split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
            dependencies[trimmed] = "detected";
        }
    }

    const allDepKeys = [
        ...Object.keys(dependencies),
        ...Object.keys(devDependencies),
    ].join(" ").toLowerCase();

    const frameworksDetected: string[] = [];
    for (const [framework, signatures] of Object.entries(FRAMEWORK_SIGNATURES)) {
        if (signatures.some((sig) => allDepKeys.includes(sig.toLowerCase()))) {
            frameworksDetected.push(framework);
        }
    }

    return {
        filename,
        frameworkDetected: frameworksDetected,
        dependencies,
        devDependencies,
    };
}
