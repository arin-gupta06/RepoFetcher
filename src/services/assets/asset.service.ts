import path from "node:path";
import crypto from "node:crypto";

import {
    AssetFactory,
    AssetRequest,
    AssetResult,
    AssetMetadata,
    UploadRequest,
    UploadAsset,
} from ".";

interface ImageDimensions {
    width: number;
    height: number;
}

class AssetDownloadError extends Error {
    public constructor(
        message: string,
        public readonly status: number
    ) {
        super(message);
    }
}

export class AssetService {

    public async process(
        request: AssetRequest
    ): Promise<AssetResult> {

        this.log(`Downloading ${request.url}`);

        const buffer = await this.download(request.url);

        const uploadRequest = this.buildUploadRequest(
            request,
            buffer
        );

        this.log("Uploading asset...");

        const uploadedAsset = await this.upload(uploadRequest);

        this.log("Extracting metadata...");

        const metadata = await this.extractMetadata(
            request.url,
            buffer
        );

        this.log("Asset processed.");

        return this.buildResult(
            request,
            uploadedAsset,
            metadata
        );
    }

    private async download(
        url: string
    ): Promise<Buffer> {

        return this.withRetry(
            () => this.fetchAsset(url),
            (error) => this.isRetryableDownloadError(error)
        );
    }

    private async fetchAsset(
        url: string
    ): Promise<Buffer> {

        const response = await fetch(url);

        if (!response.ok) {
            throw new AssetDownloadError(
                `Failed to download asset (${response.status})`,
                response.status
            );
        }

        return Buffer.from(await response.arrayBuffer());
    }

    private async upload(
        uploadRequest: UploadRequest
    ): Promise<UploadAsset> {

        const provider = AssetFactory.create("imagekit");

        return this.withRetry(
            () => provider.upload(uploadRequest),
            () => true
        );
    }

    private buildUploadRequest(
        request: AssetRequest,
        buffer: Buffer
    ): UploadRequest {

        return {
            file: buffer,
            fileName: this.buildFileName(request.url),
            folder: `${request.repositoryName}/${request.type}`,
        };
    }

    private async extractMetadata(
        url: string,
        buffer: Buffer
    ): Promise<AssetMetadata> {
        const mimeType = this.resolveMimeType(url);
        const dimensions = this.resolveDimensions(buffer, mimeType);

        return {
            width: dimensions.width,
            height: dimensions.height,
            size: buffer.length,
            mimeType,
            extension: this.resolveExtension(url),
            hash: crypto
                .createHash("sha256")
                .update(buffer)
                .digest("hex"),
        };
    }

    private buildResult(
        request: AssetRequest,
        uploadedAsset: UploadAsset,
        metadata: AssetMetadata
    ): AssetResult {

        return {
            originalUrl: request.url,
            uploadedAsset,
            metadata,
        };
    }

    private buildFileName(
        url: string
    ): string {

        return `${crypto
            .createHash("md5")
            .update(url)
            .digest("hex")}${this.resolveExtension(url)}`;
    }

    private resolveMimeType(
        url: string
    ): string {

        const parsedUrl = this.parseUrl(url);
        const requestedType = parsedUrl?.searchParams
            .get("type")
            ?.toLowerCase();

        if (requestedType && requestedType in imageTypes) {
            return imageTypes[requestedType];
        }

        const extension = this.resolveExtension(url);

        return (
            mimeTypes[extension] ??
            "application/octet-stream"
        );
    }

    private resolveExtension(
        url: string
    ): string {

        const parsedUrl = this.parseUrl(url);
        const requestedType = parsedUrl?.searchParams
            .get("type")
            ?.toLowerCase();

        if (requestedType && requestedType in imageExtensions) {
            return imageExtensions[requestedType];
        }

        return path
            .extname(parsedUrl?.pathname ?? url)
            .toLowerCase();
    }

    private resolveDimensions(
        buffer: Buffer,
        mimeType: string
    ): ImageDimensions {

        return (
            this.resolvePngDimensions(buffer, mimeType) ??
            this.resolveJpegDimensions(buffer, mimeType) ??
            this.resolveGifDimensions(buffer, mimeType) ??
            this.resolveWebpDimensions(buffer, mimeType) ??
            this.resolveSvgDimensions(buffer, mimeType) ??
            { width: 0, height: 0 }
        );
    }

    private resolvePngDimensions(
        buffer: Buffer,
        mimeType: string
    ): ImageDimensions | null {

        if (
            mimeType !== "image/png" ||
            buffer.length < 24 ||
            buffer.toString("ascii", 1, 4) !== "PNG"
        ) {
            return null;
        }

        return {
            width: buffer.readUInt32BE(16),
            height: buffer.readUInt32BE(20),
        };
    }

    private resolveJpegDimensions(
        buffer: Buffer,
        mimeType: string
    ): ImageDimensions | null {

        if (
            mimeType !== "image/jpeg" ||
            buffer.length < 4 ||
            buffer[0] !== 0xff ||
            buffer[1] !== 0xd8
        ) {
            return null;
        }

        let offset = 2;

        while (offset + 9 < buffer.length) {
            if (buffer[offset] !== 0xff) {
                offset += 1;
                continue;
            }

            const marker = buffer[offset + 1];
            const length = buffer.readUInt16BE(offset + 2);

            if (length < 2 || offset + 2 + length > buffer.length) {
                return null;
            }

            if (this.isJpegStartOfFrame(marker)) {
                return {
                    height: buffer.readUInt16BE(offset + 5),
                    width: buffer.readUInt16BE(offset + 7),
                };
            }

            offset += 2 + length;
        }

        return null;
    }

    private resolveGifDimensions(
        buffer: Buffer,
        mimeType: string
    ): ImageDimensions | null {

        if (
            mimeType !== "image/gif" ||
            buffer.length < 10 ||
            !buffer.toString("ascii", 0, 6).startsWith("GIF")
        ) {
            return null;
        }

        return {
            width: buffer.readUInt16LE(6),
            height: buffer.readUInt16LE(8),
        };
    }

    private resolveWebpDimensions(
        buffer: Buffer,
        mimeType: string
    ): ImageDimensions | null {

        if (
            mimeType !== "image/webp" ||
            buffer.length < 30 ||
            buffer.toString("ascii", 0, 4) !== "RIFF" ||
            buffer.toString("ascii", 8, 12) !== "WEBP"
        ) {
            return null;
        }

        const format = buffer.toString("ascii", 12, 16);

        if (format === "VP8X" && buffer.length >= 30) {
            return {
                width: 1 + buffer.readUIntLE(24, 3),
                height: 1 + buffer.readUIntLE(27, 3),
            };
        }

        if (format === "VP8 " && buffer.length >= 30) {
            return {
                width: buffer.readUInt16LE(26) & 0x3fff,
                height: buffer.readUInt16LE(28) & 0x3fff,
            };
        }

        if (format === "VP8L" && buffer.length >= 25) {
            const bits = buffer.readUInt32LE(21);

            return {
                width: (bits & 0x3fff) + 1,
                height: ((bits >> 14) & 0x3fff) + 1,
            };
        }

        return null;
    }

    private resolveSvgDimensions(
        buffer: Buffer,
        mimeType: string
    ): ImageDimensions | null {

        if (mimeType !== "image/svg+xml") {
            return null;
        }

        const svg = buffer.toString("utf8", 0, 4096);
        const width = this.extractSvgLength(svg, "width");
        const height = this.extractSvgLength(svg, "height");

        if (width && height) {
            return { width, height };
        }

        const viewBox = svg.match(
            /\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i
        );

        if (!viewBox) {
            return null;
        }

        return {
            width: Math.round(Number(viewBox[1])),
            height: Math.round(Number(viewBox[2])),
        };
    }

    private extractSvgLength(
        svg: string,
        attribute: "width" | "height"
    ): number | null {

        const match = svg.match(
            new RegExp(`\\b${attribute}=["']([\\d.]+)`, "i")
        );

        if (!match) {
            return null;
        }

        return Math.round(Number(match[1]));
    }

    private isJpegStartOfFrame(marker: number): boolean {
        return (
            marker >= 0xc0 &&
            marker <= 0xcf &&
            ![0xc4, 0xc8, 0xcc].includes(marker)
        );
    }

    private async withRetry<T>(
        operation: () => Promise<T>,
        shouldRetry: (error: unknown) => boolean
    ): Promise<T> {

        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                return await operation();
            } catch (error) {
                if (
                    attempt === maxAttempts ||
                    !shouldRetry(error)
                ) {
                    throw error;
                }

                await this.delay(250 * attempt);
            }
        }

        throw new Error("Retry attempts exhausted.");
    }

    private isRetryableDownloadError(error: unknown): boolean {
        if (!(error instanceof AssetDownloadError)) {
            return true;
        }

        return (
            error.status === 408 ||
            error.status === 429 ||
            error.status >= 500
        );
    }

    private async delay(milliseconds: number): Promise<void> {
        await new Promise((resolve) => {
            setTimeout(resolve, milliseconds);
        });
    }

    private parseUrl(url: string): URL | null {
        try {
            return new URL(url);
        } catch {
            return null;
        }
    }

    private log(
        message: string
    ): void {
        console.log(`[AssetService] ${message}`);
    }
}

const imageTypes: Record<string, string> = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
};

const imageExtensions: Record<string, string> = {
    jpeg: ".jpg",
    jpg: ".jpg",
    png: ".png",
    webp: ".webp",
    gif: ".gif",
    svg: ".svg",
};

const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
};
