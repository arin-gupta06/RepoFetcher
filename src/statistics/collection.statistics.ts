interface CollectionStatisticsSnapshot {
    repositories: number;
    datasets: number;
    readmes: number;
    imagesExtracted: number;
    imagesFiltered: number;
    imagesUploaded: number;
    imageFailures: number;
    diagramsExtracted: number;
    diagramsProcessed: number;
    diagramFailures: number;
}

class CollectionStatistics {
    private readonly counters: CollectionStatisticsSnapshot = {
        repositories: 0,
        datasets: 0,
        readmes: 0,
        imagesExtracted: 0,
        imagesFiltered: 0,
        imagesUploaded: 0,
        imageFailures: 0,
        diagramsExtracted: 0,
        diagramsProcessed: 0,
        diagramFailures: 0,
    };

    public incrementRepositories(count = 1): void {
        this.increment("repositories", count);
    }

    public incrementDatasets(count = 1): void {
        this.increment("datasets", count);
    }

    public incrementReadmes(count = 1): void {
        this.increment("readmes", count);
    }

    public incrementImagesExtracted(count = 1): void {
        this.increment("imagesExtracted", count);
    }

    public incrementImagesFiltered(count = 1): void {
        this.increment("imagesFiltered", count);
    }

    public incrementImagesUploaded(count = 1): void {
        this.increment("imagesUploaded", count);
    }

    public incrementImageFailures(count = 1): void {
        this.increment("imageFailures", count);
    }

    public incrementDiagramsExtracted(count = 1): void {
        this.increment("diagramsExtracted", count);
    }

    public incrementDiagramsProcessed(count = 1): void {
        this.increment("diagramsProcessed", count);
    }

    public incrementDiagramFailures(count = 1): void {
        this.increment("diagramFailures", count);
    }

    public printSummary(): void {
        const rows: Array<[string, number]> = [
            ["Repositories Collected", this.counters.repositories],
            ["Datasets Collected", this.counters.datasets],
            ["READMEs Collected", this.counters.readmes],
            ["Images Extracted", this.counters.imagesExtracted],
            ["Images Filtered", this.counters.imagesFiltered],
            ["Images Uploaded", this.counters.imagesUploaded],
            ["Image Failures", this.counters.imageFailures],
            ["Diagrams Extracted", this.counters.diagramsExtracted],
            ["Diagrams Processed", this.counters.diagramsProcessed],
            ["Diagram Failures", this.counters.diagramFailures],
        ];

        console.log("================ COLLECTION SUMMARY ================");

        for (const [label, value] of rows) {
            console.log(`${label.padEnd(23, " ")}: ${value}`);
        }

        console.log("====================================================");
    }

    private increment(
        counter: keyof CollectionStatisticsSnapshot,
        count: number
    ): void {
        if (!Number.isFinite(count) || count <= 0) {
            return;
        }

        this.counters[counter] += count;
    }
}

export const collectionStatistics = new CollectionStatistics();
