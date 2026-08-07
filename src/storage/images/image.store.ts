import type { ImageMetadata } from "./image.metadata";

export class ImageStore {
  private readonly images = new Map<string, ImageMetadata>();

  addMany(images: ImageMetadata[]): void {
    for (const image of images) {
      this.images.set(image.id, image);
    }
  }

  getAll(): ImageMetadata[] {
    return Array.from(this.images.values());
  }
}
