interface RepositoryContext {
    owner: string;
    repository: string;
    branch: string;
}

const MARKDOWN_IMAGE_REGEX =
    /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const HTML_IMAGE_REGEX =
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

export function extractImages(
    markdown: string,
    repository: RepositoryContext
): string[] {

    const images = new Set<string>();

    extractMarkdownImages(markdown, repository)
        .forEach((url) => images.add(url));

    extractHtmlImages(markdown, repository)
        .forEach((url) => images.add(url));

    return [...images];
}

function extractMarkdownImages(
    markdown: string,
    repository: RepositoryContext
): string[] {

    const images: string[] = [];

    let match: RegExpExecArray | null;

    while ((match = MARKDOWN_IMAGE_REGEX.exec(markdown)) !== null) {

        images.push(
            resolveUrl(match[1], repository)
        );
    }

    return images;
}

function extractHtmlImages(
    markdown: string,
    repository: RepositoryContext
): string[] {

    const images: string[] = [];

    let match: RegExpExecArray | null;

    while ((match = HTML_IMAGE_REGEX.exec(markdown)) !== null) {

        images.push(
            resolveUrl(match[1], repository)
        );
    }

    return images;
}

function resolveUrl(
    url: string,
    repository: RepositoryContext
): string {

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    if (url.startsWith("//")) {
        return `https:${url}`;
    }

    const normalized = url
        .replace(/^\.?\//, "")
        .replace(/\\/g, "/");

    return `https://raw.githubusercontent.com/${
        repository.owner
    }/${
        repository.repository
    }/${
        repository.branch
    }/${
        normalized
    }`;
}
