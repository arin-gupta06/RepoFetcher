import type { DiagramMetadata } from "./diagram.metadata";

export class DiagramStore {
  private readonly diagrams = new Map<string, DiagramMetadata>();

  addMany(diagrams: DiagramMetadata[]): void {
    for (const diagram of diagrams) {
      this.diagrams.set(diagram.id, diagram);
    }
  }

  getAll(): DiagramMetadata[] {
    return Array.from(this.diagrams.values());
  }
}
