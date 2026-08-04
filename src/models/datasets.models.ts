export interface Dataset {
    id: string;
    title: string;
    slug: string;
    owner: {
        username: string;
        profileUrl: string;
    }

    description: string | null;
    url: string;
    downloads: number;
    votes: number;

    tags: string[];
    size: string | null;

    license: string | null;

    createdAt: Date | null;
    updatedAt: Date | null;

    source: "kaggle"

}