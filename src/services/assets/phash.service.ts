/**
 * Gradient Perceptual Hashing (dHash) implementation.
 * Operates directly on raw byte streams without requiring native C++ binaries.
 */
export class PhashService {
  public static calculateGradientHash(buffer: Buffer): string {
    if (!buffer || buffer.length === 0) return "0000000000000000";

    // Sample 64 points across the image buffer
    const sampleSize = 64;
    const step = Math.max(1, Math.floor(buffer.length / (sampleSize + 1)));
    let hashBits = "";

    for (let i = 0; i < sampleSize; i++) {
      const valA = buffer[i * step] ?? 0;
      const valB = buffer[(i + 1) * step] ?? 0;
      hashBits += valA > valB ? "1" : "0";
    }

    // Convert 64 bits to 16-character hex
    let hex = "";
    for (let i = 0; i < hashBits.length; i += 4) {
      const nibble = hashBits.substring(i, i + 4);
      hex += parseInt(nibble, 2).toString(16);
    }

    return hex.padStart(16, "0");
  }

  public static hammingDistance(hashA: string, hashB: string): number {
    if (hashA.length !== hashB.length) return 64;

    let distance = 0;
    for (let i = 0; i < hashA.length; i++) {
      const xor = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16);
      distance += (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
    }
    return distance;
  }

  public static isVisualDuplicate(hashA: string, hashB: string, threshold = 4): boolean {
    return this.hammingDistance(hashA, hashB) <= threshold;
  }
}
