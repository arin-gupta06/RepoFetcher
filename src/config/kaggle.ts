import dotenv from "dotenv"

dotenv.config()

const kaggleToken = process.env.KAGGLE_TOKEN

if(!kaggleToken) throw new Error("Kaggle API is missing!!.");

export const KaggleConfig = {
    token: kaggleToken,
}