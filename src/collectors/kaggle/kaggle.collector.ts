
import type { Dataset } from "../../models/datasets.models";
import { KAGGLE_SEARCH_TERMS } from "../../constants/kaggle.constants";
import {execFile} from "node:child_process";
import { promisify } from "node:util";
import {KaggleDatasetRecord} from "../../models/record.models"
import {parse} from "csv-parse/sync";

export async function collectKaggleDatasets(): Promise<Dataset[]> {
  const datasetMap = new Map <string, Dataset>();

  for (const [category, queries] of Object.entries(KAGGLE_SEARCH_TERMS)) {
    console.log(`\n===== ${category.toUpperCase()} =====`);

    for (const query of queries) {
      const datasets = await searchDatasets(query);

      console.log(`"${query}" → ${datasets.length} datasets`);

      for (const dataset of datasets) {
        datasetMap.set(dataset.id, dataset);
      }
    }
  }
  return Array.from(datasetMap.values());
}
const execFileAsync = promisify(execFile);
async function searchDatasets(query: string): Promise<Dataset[]>{
  try {
    const { stdout } = await execFileAsync(
    "kaggle",
    [
      "datasets",
      "list",
      "--search",
      query,
      "--page-size",
      "200",
      "--csv",
    ]
  );
    return parseDatasetCSV(stdout)
  } catch (error) {
    console.error(`Failed to search on Kaggle for ${query}`)

    return [];
  }
}

function parseDatasetCSV(csv: string): Dataset[] {
    const records = parse(csv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as KaggleDatasetRecord[];

    return records.map((record): Dataset => {
        const [username = "", slug = record.ref] = record.ref.split("/");

        return {
            id: record.ref,

            title: record.title,

            slug,

            owner: {
                username,
                profileUrl: `https://www.kaggle.com/${username}`,
            },

            description: null, 

            url: `https://www.kaggle.com/datasets/${username}/${slug}`,

            downloads: Number(record.downloadCount ?? 0),

            votes: Number(record.voteCount ?? 0),

            tags: [], 

            size: record.size ?? null,

            license: null, 

            createdAt: null, 

            updatedAt: record.lastUpdated
                ? new Date(record.lastUpdated)
                : null,

            source: "kaggle",
        };
    });
}