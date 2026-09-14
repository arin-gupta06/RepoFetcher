import type { DiagramContext } from "../../../services/assets/asset.interface";
import {
  extractImagesWithContext,
  RepositoryContext,
} from "./image.extractors";

export interface ExtractedDiagramCandidate {
  url: string;
  context: DiagramContext;
}

const DIAGRAM_KEYWORDS = [
  "architecture",
  "diagram",
  "system",
  "design",
  "uml",
  "flow",
  "flowchart",
  "workflow",
  "pipeline",
  "schema",
  "erd",
  "sequence",
  "component",
  "deployment",
  "topology",
];

const DIAGRAM_FOLDERS = [
  "architecture",
  "diagram",
  "diagrams",
  "uml",
  "flowcharts",
];

const MERMAID_REGEX = /```mermaid\s*([\s\S]*?)```/gi;

export function extractDiagramsWithContext(
  markdown: string,
  repoContext: RepositoryContext
): ExtractedDiagramCandidate[] {
  const candidates: ExtractedDiagramCandidate[] = [];

  // 1. Extract markdown/HTML images and check if they live in architecture sections or have diagram keywords
  const extractedImages = extractImagesWithContext(markdown, repoContext);
  for (const item of extractedImages) {
    if (isDiagramAsset(item.url, item.context)) {
      candidates.push(item);
    }
  }

  // 2. Extract native Mermaid code blocks
  let match: RegExpExecArray | null;
  while ((match = MERMAID_REGEX.exec(markdown)) !== null) {
    const rawMermaid = match[1].trim();
    if (rawMermaid) {
      const encoded = Buffer.from(rawMermaid, "utf8").toString("base64url");
      const renderedUrl = `https://mermaid.ink/img/${encoded}?type=png&bgColor=!white`;

      candidates.push({
        url: renderedUrl,
        context: {
          sectionHeading: findPrecedingHeading(markdown, match.index),
          surroundingText: null,
          altText: "Mermaid Code Architecture Diagram",
          isVectorCode: true,
          rawCode: rawMermaid,
        },
      });
    }
  }

  return candidates;
}

export function extractDiagrams(
  markdown: string,
  repoContext: RepositoryContext
): string[] {
  return extractDiagramsWithContext(markdown, repoContext).map((c) => c.url);
}

function isDiagramAsset(url: string, context: DiagramContext): boolean {
  const textToScan = [
    url,
    context.altText ?? "",
    context.sectionHeading ?? "",
  ].join(" ").toLowerCase();

  return (
    DIAGRAM_KEYWORDS.some((kw) => textToScan.includes(kw)) ||
    isDiagramFolder(url)
  );
}

function isDiagramFolder(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname
      .toLowerCase()
      .split("/")
      .filter(Boolean);

    return pathSegments.some((segment) => DIAGRAM_FOLDERS.includes(segment));
  } catch {
    return false;
  }
}

function findPrecedingHeading(
  markdown: string,
  charIndex: number
): string | null {
  const textBefore = markdown.substring(0, charIndex);
  const headings = textBefore.match(/^#{1,3}\s+(.+)$/gm);
  if (!headings || headings.length === 0) return null;
  return headings[headings.length - 1].replace(/^#{1,3}\s+/, "").trim();
}
