export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  owner: {
    login: string;
    avatarUrl: string;
    profileUrl: string;
  };
  source: "github" | "kaggle";
  topics: string[];
  createdAt: string | null;
  updatedAt: string | null;
}
