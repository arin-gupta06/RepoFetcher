import { promises as fs } from "node:fs";
import path from "node:path";


export class CheckpointStore {
    private readonly filePath: string;
    private processedIds = new Set<number>();
    private isloaded = false;

    constructor(filePath = "data/checkpoints.json") {
        this.filePath = filePath;
    }

    public async load(): Promise<void> {
        if (this.isloaded) return;

        try {
            const content = await fs.readFile(this.filePath,
                "utf-8"
            );
            const ids: number[] = JSON.parse(content);
            this.processedIds = new Set(ids);
        } catch {
            this.processedIds = new Set();
        }
        this.isloaded = true;
    }

    public has(repositoryId: number): boolean {
        return this.processedIds.has(repositoryId);
    }

    public async markProcessed(repositoryId: number):
        Promise<void> {
        this.processedIds.add(repositoryId);
        await this.persist();
    }
    public getProcessedCount(): number {
        return this.processedIds.size;
    }

    private async persist(): Promise<void> {
        const dir = path.dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.filePath,
            JSON.stringify(Array.from(this.processedIds)), "utf-8");
    }
}