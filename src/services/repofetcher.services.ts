import {octokit} from "../config/github.js";
import { Endpoints } from "@octokit/types";
export type Repository =
  Endpoints["GET /search/repositories"]["response"]["data"]["items"][number];

export async function fetchRepositories(language: string): Promise<Repository[]> {
    const response = await octokit.search.repos({
        q: `language:${language} stars:>500`,
        sort: "stars",
        order: "desc",
        per_page: 10,
    });

    return response.data.items;
}