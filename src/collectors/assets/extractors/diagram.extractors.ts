import { extractImages } from "./image.extractors";

interface RepositoryContext {
    owner: string;
    repository: string;
    branch: string;
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

const MERMAID_REGEX =
    /```mermaid\s*([\s\S]*?)```/gi;

export function extractDiagrams(
    markdown: string,
    repository: RepositoryContext
): string[] {
    const diagrams = new Set<string>();

    extractImages(markdown, repository)
        .filter(isDiagramAsset)
        .forEach((url) => diagrams.add(url));

    extractMermaidDiagrams(markdown)
        .forEach((url) => diagrams.add(url));

    return [...diagrams];
}

function isDiagramAsset(url: string): boolean {
    return (
        containsDiagramKeyword(url) ||
        isDiagramFolder(url)
    );
}

function containsDiagramKeyword(url: string): boolean {
    return containsKeyword(url, DIAGRAM_KEYWORDS);
}

function isDiagramFolder(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname
            .toLowerCase()
            .split("/")
            .filter(Boolean);

        return pathSegments.some((segment) => (
            DIAGRAM_FOLDERS.includes(segment)
        ));
    } catch {
        return false;
    }
}

function containsKeyword(
    url: string,
    keywords: string[]
): boolean {
    const searchableUrl = safelyDecodeUrl(url.toLowerCase())
        .replace(/[^a-z0-9]+/g, " ");
    const terms = searchableUrl.split(" ");

    return keywords.some((keyword) => (
        terms.includes(keyword)
    ));
}

function safelyDecodeUrl(url: string): string {
    try {
        return decodeURIComponent(url);
    } catch {
        return url;
    }
}

function extractMermaidDiagrams(markdown: string): string[] {
    const diagrams: string[] = [];

    let match: RegExpExecArray | null;

    while ((match = MERMAID_REGEX.exec(markdown)) !== null) {
        const diagram = match[1].trim();

        if (diagram) {
            diagrams.push(buildMermaidImageUrl(diagram));
        }
    }

    return diagrams;
}

function buildMermaidImageUrl(diagram: string): string {
    const encodedDiagram = Buffer
        .from(diagram, "utf8")
        .toString("base64url");

    return `https://mermaid.ink/img/${encodedDiagram}?type=png&bgColor=!white`;
}
