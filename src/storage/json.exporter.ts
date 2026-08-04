import { writeFile } from "node:fs/promises";
import type { Repository } from "../models/repository.model";

export async function exportRepositoriesToJson(
  repositories: Repository[],
  outputPath: string,
): Promise<void> {
  await writeFile(outputPath, JSON.stringify(repositories, null, 2));
}
