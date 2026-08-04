import { languages } from "./constants/languages.constants";
import { fetchRepositories } from "./services/repofetcher.services";

async function main() {
  for (const language of languages) {
    console.log(`\n===== ${language} =====`);

    const repos = await fetchRepositories(language);

    repos.forEach((repo : any) => {
      console.log(repo.full_name);
    });
  }
}

main();