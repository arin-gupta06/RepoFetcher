const BLOCKED_HOSTS = [
    "avatars.githubusercontent.com",
    "img.shields.io",
    "badgen.net",
    "komarev.com",
    "visitor-badge.laobi.icu",
    "hits.seeyoufarm.com",
    "github-readme-stats.vercel.app",
    "github-profile-summary-cards.vercel.app",
    "api.iconify.design",
    "producthunt.com",
    "www.producthunt.com",
    "trendshift.io",
    "opencollective.com",
    "www.opencollective.com",
    "forthebadge.com",
    "www.forthebadge.com",
];

const HARD_BLOCKED_KEYWORDS = [
    "badge",
    "shield",
    "license",
    "contributors",
    "visitor",
    "downloads",
    "coverage",
    "stars",
    "forks",
    "build",
];

const AMBIGUOUS_BLOCKED_KEYWORDS = [
    "workflow",
    "pipeline",
];

const PREFERRED_FOLDERS = [
    "docs",
    "assets",
    "images",
    "image",
    "media",
    "screenshots",
    "demo",
];

const PREFERRED_KEYWORDS = [
    "architecture",
    "diagram",
    "system",
    "design",
    "uml",
    "flow",
    "dashboard",
    "preview",
    "ui",
    "screenshot",
];

export function shouldKeepImage(url: string): boolean {
    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
        return false;
    }

    if (isBlockedHost(normalizedUrl)) {
        return false;
    }

    if (containsHardBlockedKeyword(normalizedUrl)) {
        return false;
    }

    if (
        containsAmbiguousBlockedKeyword(normalizedUrl) &&
        !looksLikeMeaningfulAsset(normalizedUrl)
    ) {
        return false;
    }

    return true;
}

function normalizeUrl(url: string): string | null {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
        return null;
    }

    try {
        const parsedUrl = new URL(trimmedUrl);

        parsedUrl.hash = "";

        return parsedUrl.toString().toLowerCase();
    } catch {
        return null;
    }
}

function isBlockedHost(url: string): boolean {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();

    return BLOCKED_HOSTS.some((blockedHost) => (
        host === blockedHost ||
        host.endsWith(`.${blockedHost}`)
    ));
}

function containsHardBlockedKeyword(url: string): boolean {
    return containsKeyword(url, HARD_BLOCKED_KEYWORDS);
}

function containsAmbiguousBlockedKeyword(url: string): boolean {
    return containsKeyword(url, AMBIGUOUS_BLOCKED_KEYWORDS);
}

function looksLikeMeaningfulAsset(url: string): boolean {
    return (
        isPreferredFolder(url) ||
        containsPreferredKeyword(url)
    );
}

function isPreferredFolder(url: string): boolean {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname
        .toLowerCase()
        .split("/")
        .filter(Boolean);

    return pathSegments.some((segment) => (
        PREFERRED_FOLDERS.includes(segment)
    ));
}

function containsPreferredKeyword(url: string): boolean {
    return containsKeyword(url, PREFERRED_KEYWORDS);
}

function containsKeyword(
    url: string,
    keywords: string[]
): boolean {
    const searchableUrl = safelyDecodeUrl(url)
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
