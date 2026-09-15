/**
 * Text Cleaner Utility
 * Sanitizes markdown and documentation text for ML model training & embedding generation.
 */

export class TextCleaner {
  /**
   * Sanitizes markdown text by stripping noise while preserving structural heading context.
   */
  public static cleanMarkdown(text: string | null | undefined): string {
    if (!text || typeof text !== "string") {
      return "";
    }

    let cleaned = text;

    // 1. Remove HTML comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

    // 2. Remove HTML tags (e.g. <div align="center">, <img ...>)
    cleaned = cleaned.replace(/<[^>]+>/g, " ");

    // 3. Remove Markdown badges & shields (e.g. [![Build Status](...)...])
    cleaned = cleaned.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "");
    cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, ""); // image tags

    // 4. Clean Markdown Links - replace [text](url) with just 'text'
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // 5. Remove raw URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s)]+/gi, "");

    // 6. Normalize code blocks: keep inline code, clean large code block formatting
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
      // Keep short code blocks (< 300 chars) as code context, strip extremely long ones
      if (match.length > 500) {
        return " [Code snippet removed] ";
      }
      return match.replace(/```/g, "").trim();
    });

    // 7. Strip non-printable ASCII / control characters
    cleaned = cleaned.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

    // 8. Normalize whitespace and newlines
    cleaned = cleaned
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    return cleaned;
  }

  /**
   * Extracts primary overview summary section from a cleaned README
   */
  public static extractSummarySection(cleanedMarkdown: string, maxLength = 1000): string {
    if (!cleanedMarkdown) return "";

    const paragraphs = cleanedMarkdown.split("\n\n");
    let summary = "";

    for (const p of paragraphs) {
      if (summary.length + p.length > maxLength) break;
      summary += p + "\n\n";
    }

    return summary.trim();
  }
}
