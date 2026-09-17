"""
RepoLens AI — Automated GitHub Repository Structure & Metadata Detector
Fetches live repository signals (stars, language, file counts, directory layers,
frameworks from manifests, architecture docs, and README) given a GitHub URL or slug.
"""

from __future__ import annotations

import base64
import json
import os
import re
from pathlib import Path
from typing import Any, Optional
import requests
from dotenv import load_dotenv

# Load GitHub Token if present
load_dotenv(Path(__file__).parent.parent / ".env")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()

GITHUB_API_BASE = "https://api.github.com"

# Common architectural layer directory names
KNOWN_LAYERS = [
    "controllers", "services", "repositories", "models", "infrastructure",
    "domain", "application", "interfaces", "handlers", "middleware",
    "adapters", "routes", "commands", "queries", "resolvers", "schema",
    "views", "components", "pages", "modules", "events"
]

# Manifest framework detection keywords
FRAMEWORK_DEPENDENCIES = {
    "nestjs": "NestJS",
    "@nestjs/core": "NestJS",
    "express": "Express",
    "fastify": "Fastify",
    "koa": "Koa",
    "next": "Next.js",
    "react": "React",
    "vue": "Vue",
    "angular": "Angular",
    "django": "Django",
    "fastapi": "FastAPI",
    "flask": "Flask",
    "spring-boot": "Spring Boot",
    "gin-gonic": "Gin",
    "actix-web": "Actix",
    "axum": "Axum",
    "apollo-server": "Apollo Server",
    "typeorm": "TypeORM",
    "prisma": "Prisma",
    "dapr": "Dapr",
}


def parse_repo_slug(url_or_slug: str) -> Optional[tuple[str, str]]:
    """
    Parses various GitHub URL formats and slugs into (owner, repo).
    Examples:
      - https://github.com/expressjs/express
      - https://github.com/expressjs/express.git
      - github.com/expressjs/express
      - git@github.com:expressjs/express.git
      - expressjs/express
    """
    clean = url_or_slug.strip().replace(".git", "")
    
    # Handle git@github.com:owner/repo
    if clean.startswith("git@github.com:"):
        clean = clean.replace("git@github.com:", "")
    
    # Handle https://github.com/owner/repo or http://
    clean = re.sub(r"^https?://(www\.)?github\.com/", "", clean)
    clean = re.sub(r"^github\.com/", "", clean)
    
    parts = [p for p in clean.strip("/").split("/") if p]
    if len(parts) >= 2:
        return parts[0], parts[1]
    return None


def get_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "RepoLens-AI-Architecture-Detector",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


def clean_readme_prose(text: str) -> str:
    """Strips badges, shields, build images, and markdown link boilerplate."""
    if not text:
        return ""
    text = re.sub(r"<img[^>]*>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\[!\[.*?\]\(.*?\)\]\(.*?\)", " ", text)
    text = re.sub(r"!\[.*?\]\(.*?\)", " ", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"^\s*\[[^\]]+\]:\s*\S+", " ", text, flags=re.MULTILINE)
    text = re.sub(r"(?i)#+\s*(license|badges?|build status|ci|codecov|backers?|sponsors?).*", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def detect_repository_metadata(repo_url_or_slug: str) -> dict[str, Any]:
    parsed = parse_repo_slug(repo_url_or_slug)
    if not parsed:
        raise ValueError(
            f"Invalid GitHub repository URL or slug: '{repo_url_or_slug}'. "
            "Please provide a format like 'owner/repo' or 'https://github.com/owner/repo'."
        )

    owner, repo = parsed
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    # 1. Fetch Repository Metadata
    repo_api_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}"
    resp = requests.get(repo_api_url, headers=headers, timeout=10)
    if resp.status_code == 404:
        raise ValueError(f"Repository '{owner}/{repo}' not found on GitHub.")
    if resp.status_code != 200:
        raise ValueError(f"GitHub API error ({resp.status_code}): {resp.text}")

    repo_data = resp.json()
    full_name = repo_data.get("full_name", f"{owner}/{repo}")
    stars = repo_data.get("stargazers_count", 0)
    language = repo_data.get("language") or "TypeScript"
    default_branch = repo_data.get("default_branch", "main")
    description = repo_data.get("description") or ""

    # 2. Fetch README
    readme_snippet = clean_readme_prose(description)
    try:
        readme_resp = requests.get(f"{GITHUB_API_BASE}/repos/{owner}/{repo}/readme", headers=headers, timeout=8)
        if readme_resp.status_code == 200:
            content_b64 = readme_resp.json().get("content", "")
            raw_readme = base64.b64decode(content_b64).decode("utf-8", errors="ignore")
            cleaned_prose = clean_readme_prose(raw_readme)
            if cleaned_prose:
                readme_snippet = cleaned_prose[:1200]
    except Exception:
        pass

    # 3. Fetch Git Tree to detect layers, total file count, and arch docs
    total_files = 0
    detected_layers: set[str] = set()
    detected_frameworks: set[str] = set()
    has_arch_docs = False

    try:
        tree_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        tree_resp = requests.get(tree_url, headers=headers, timeout=10)
        if tree_resp.status_code == 200:
            tree_items = tree_resp.json().get("tree", [])
            paths = [item.get("path", "") for item in tree_items if item.get("type") == "blob"]
            total_files = len(paths)

            # Scan directory components for known layers
            for p in paths:
                p_lower = p.lower()
                segments = p_lower.split("/")
                
                # Check for architecture documentation
                if any(doc_key in p_lower for doc_key in ["docs/arch", "adr/", "c4/", "architecture.md", "architecture/", "design/"]):
                    has_arch_docs = True

                for seg in segments[:-1]:  # exclude file name, inspect directories
                    if seg in KNOWN_LAYERS:
                        detected_layers.add(seg)

            # Check manifests for frameworks
            manifest_files = [p for p in paths if p in ["package.json", "requirements.txt", "pyproject.toml", "go.mod", "pom.xml", "Cargo.toml"]]
            for mf in manifest_files[:2]:
                try:
                    raw_content_resp = requests.get(
                        f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{mf}",
                        headers=headers,
                        timeout=6
                    )
                    if raw_content_resp.status_code == 200:
                        content_lower = raw_content_resp.text.lower()
                        for key, fw_name in FRAMEWORK_DEPENDENCIES.items():
                            if key in content_lower:
                                detected_frameworks.add(fw_name)
                except Exception:
                    pass
    except Exception:
        pass

    # Fallback heuristics if tree was truncated or empty
    if not detected_layers:
        desc_lower = (description + " " + readme_snippet).lower()
        for layer in ["controllers", "services", "repositories", "models"]:
            if layer in desc_lower:
                detected_layers.add(layer)
        if not detected_layers:
            detected_layers = {"controllers", "services", "models"}

    if not detected_frameworks:
        # Infer framework from repo name, topics, or readme
        topics = repo_data.get("topics", [])
        combined_meta = f"{' '.join(topics)} {description} {readme_snippet}".lower()
        for key, fw_name in FRAMEWORK_DEPENDENCIES.items():
            if key.replace("@", "").split("/")[0] in combined_meta:
                detected_frameworks.add(fw_name)

    return {
        "repo_name": full_name,
        "language": language,
        "stars": stars,
        "total_files": total_files or 50,
        "frameworks": sorted(list(detected_frameworks))[:4],
        "layers": sorted(list(detected_layers))[:8],
        "has_arch_docs": has_arch_docs,
        "readme_snippet": readme_snippet[:1200] if readme_snippet else description,
    }
