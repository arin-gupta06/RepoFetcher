import crypto from "node:crypto";
import type { ArchitectureDoc } from "../../models/architecture-doc.models";
import type { Repository } from "../../models/repository.models";

const ARCHITECTURE_DOC_PATHS = [
  "ARCHITECTURE.md",
  "architecture.md",
  "docs/architecture.md",
  "docs/ARCHITECTURE.md",
  "DESIGN.md",
  "docs/design.md",
  "CONTRIBUTING.md",
];

export async function collectRepositoryArchitectureDocs(
  repository: Repository
): Promise<ArchitectureDoc[]> {
  const docs: ArchitectureDoc[] = [];

  for (const docPath of ARCHITECTURE_DOC_PATHS) {
    const rawUrl = `https://raw.githubusercontent.com/${repository.owner.login}/${repository.name}/${repository.defaultBranch}/${docPath}`;

    try {
      const response = await fetch(rawUrl);
      if (!response.ok) continue;

      const content = await response.text();
      if (!content || content.trim().length < 50) continue;

      const headings = extractHeadings(content);
      const sha = crypto.createHash("sha256").update(content).digest("hex");

      docs.push({
        repositoryId: repository.id,
        repositoryFullName: repository.fullName,
        path: docPath,
        filename: docPath.split("/").pop()!,
        headings,
        content,
        size: Buffer.byteLength(content, "utf8"),
        sha,
        sourceUrl: rawUrl,
        fetchedAt: new Date(),
      });
    } catch {
      // Non-fatal
    }
  }

  return docs;
}

function extractHeadings(markdown: string): string[] {
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  const headings: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    headings.push(match[1].trim());
  }

  return headings;
}
