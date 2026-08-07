import { promises as fs } from "node:fs";

type JsonRecordId = string | number;

export async function exportToJson<T>(
    data: T[],
    filename: string,
): Promise<void> {
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
