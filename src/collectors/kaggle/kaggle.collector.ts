
import type { Dataset } from "../../models/datasets.models";
import { KAGGLE_SEARCH_TERMS } from "../../constants/kaggle.constants";
import {execFile} from "node:child_process";
import { promisify } from "node:util";
import {KaggleDatasetRecord} from "../../models/record.models"
import {parse} from "csv-parse/sync";
export async function collectKaggleRepositories(): Promise<Dataset[]> {
  const datasetMap = new Map <string, Dataset>();

  for (const query of KAGGLE_SEARCH_TERMS){
    try {
      const datasets = await searchDatasets(query);
      for(const dataset of datasets){
        datasetMap.set(dataset.id, dataset)
      }
    } catch (error) {
      console.error(`Failed to collect datasets for ${query}`, error)
      
    }
  }
  return Array.from(datasetMap.values());
}
const execFileAsync = promisify(execFile);
async function searchDatasets(query: string): Promise<Dataset[]>{
  try {
    const {stdout} = await execFileAsync(
      "kaggle",
      [
        "datasets",
        "list",
        "--search",
        query,
        "--csv"
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