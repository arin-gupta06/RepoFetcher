import { promises as fs } from "node:fs";

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