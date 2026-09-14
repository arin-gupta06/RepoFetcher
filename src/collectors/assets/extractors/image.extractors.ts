import type { DiagramContext } from "../../../services/assets/asset.interface";

export interface RepositoryContext {
  owner: string;
  repository: string;
  branch: string;
}

export interface ExtractedImageCandidate {
  url: string;
  context: DiagramContext;
}

const MARKDOWN_IMG_REGEX = /!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const HTML_IMG_REGEX = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

export function extractImagesWithContext(
  markdown: string,
  repo: RepositoryContext
): ExtractedImageCandidate[] {
  const results: ExtractedImageCandidate[] = [];
  const seenUrls = new Set<string>();

  // Extract Markdown images
  let match: RegExpExecArray | null;
  while ((match = MARKDOWN_IMG_REGEX.exec(markdown)) !== null) {
    const altText = match[1]?.trim() || null;
    const rawUrl = match[2];
    const resolvedUrl = resolveUrl(rawUrl, repo);

    if (resolvedUrl && !seenUrls.has(resolvedUrl)) {
      seenUrls.add(resolvedUrl);
      results.push({
        url: resolvedUrl,
        context: {
          sectionHeading: findHeadingBefore(markdown, match.index),
          surroundingText: findSurroundingText(markdown, match.index),
          altText,
          isVectorCode: false,
        },
      });
    }
  }

  // Extract HTML images
  while ((match = HTML_IMG_REGEX.exec(markdown)) !== null) {
    const rawUrl = match[1];
    const resolvedUrl = resolveUrl(rawUrl, repo);

    if (resolvedUrl && !seenUrls.has(resolvedUrl)) {
      seenUrls.add(resolvedUrl);
      results.push({
        url: resolvedUrl,
        context: {
          sectionHeading: findHeadingBefore(markdown, match.index),
          surroundingText: findSurroundingText(markdown, match.index),
          altText: null,
          isVectorCode: false,
        },
      });
    }
  }

  return results;
}

export function extractImages(
  markdown: string,
  repo: RepositoryContext
): string[] {
  return extractImagesWithContext(markdown, repo).map((item) => item.url);
}

function resolveUrl(url: string, repo: RepositoryContext): string | null {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;

  const clean = url.replace(/^\.?\//, "").replace(/\\/g, "/");
  return `https://raw.githubusercontent.com/${repo.owner}/${repo.repository}/${repo.branch}/${clean}`;
}

function findHeadingBefore(markdown: string, index: number): string | null {
  const slice = markdown.substring(0, index);
  const matches = slice.match(/^#{1,3}\s+(.+)$/gm);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1].replace(/^#{1,3}\s+/, "").trim();
}

function findSurroundingText(markdown: string, index: number): string | null {
  const start = Math.max(0, index - 200);
  const end = Math.min(markdown.length, index + 200);
  const snippet = markdown.substring(start, end).replace(/\s+/g, " ").trim();
  return snippet.length > 20 ? snippet : null;
}
