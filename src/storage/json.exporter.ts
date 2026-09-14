import { createWriteStream, WriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

type JsonRecordId = string | number;

// ==========================================
// 1. Standard Array JSON (Small files/configs)
// ==========================================

export async function exportToJson<T>(
    data: T[],
    filename: string,
): Promise<void> {
    const dir = path.dirname(filename);
    if (dir && dir !== ".") {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(
        filename,
        JSON.stringify(data, null, 2),
        "utf-8",
    );
}

export async function appendToJson<T extends object>(
    data: T[],
    filename: string,
    getId: (item: T) => JsonRecordId
): Promise<void> {
    const existingData = await readJsonArray<T>(filename);
    const mergedData = mergeById(existingData, data, getId);

    await exportToJson(mergedData, filename);
}

async function readJsonArray<T>(
    filename: string
): Promise<T[]> {
    try {
        const contents = await fs.readFile(filename, "utf-8");
        const parsed = JSON.parse(contents) as unknown;

        if (!Array.isArray(parsed)) {
            throw new Error(
                `${filename} must contain a JSON array.`
            );
        }

        return parsed as T[];
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
        ) {
            return [];
        }

        throw error;
    }
}

function mergeById<T>(
    existingData: T[],
    newData: T[],
    getId: (item: T) => JsonRecordId
): T[] {
    const mergedData = new Map<JsonRecordId, T>();

    for (const item of existingData) {
        mergedData.set(getId(item), item);
    }

    for (const item of newData) {
        mergedData.set(getId(item), item);
    }

    return Array.from(mergedData.values());
}

// ==========================================
// 2. Streaming JSONL (High-volume datasets)
// ==========================================

export class JsonlStreamWriter<T> {
    private stream: WriteStream | null = null;
    private readonly filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    private async ensureDirectoryExists(): Promise<void> {
        const dir = path.dirname(this.filePath);
        if (dir && dir !== ".") {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    private async initStream(): Promise<WriteStream> {
        if (!this.stream) {
            await this.ensureDirectoryExists();
            this.stream = createWriteStream(this.filePath, {
                flags: "a", // Append mode
                encoding: "utf-8",
            });
        }
        return this.stream;
    }

    public async writeRecord(record: T): Promise<void> {
        const stream = await this.initStream();
        const line = JSON.stringify(record) + "\n";

        return new Promise((resolve, reject) => {
            const canContinue = stream.write(line, (error) => {
                if (error) reject(error);
                else resolve();
            });

            if (!canContinue) {
                stream.once("drain", resolve);
            }
        });
    }

    public async close(): Promise<void> {
        if (this.stream) {
            return new Promise((resolve) => {
                this.stream!.end(() => {
                    this.stream = null;
                    resolve();
                });
            });
        }
    }
}

/**
 * Convenient one-shot helper to append a single line to a .jsonl file
 */
export async function appendJsonl<T>(
    record: T,
    filename: string
): Promise<void> {
    const dir = path.dirname(filename);
    if (dir && dir !== ".") {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.appendFile(filename, JSON.stringify(record) + "\n", "utf-8");
}
