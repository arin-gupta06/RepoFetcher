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


def detect_repository_metadata(url_or_slug: str) -> dict[str, Any]:
    """
    Given a GitHub URL or owner/repo string, inspects the repository and returns:
    repo_name, language, stars, total_files, frameworks, layers, has_arch_docs, readme_snippet.
    """
    slug_pair = parse_repo_slug(url_or_slug)
    if not slug_pair:
        raise ValueError(f"Could not parse a valid GitHub repository from: '{url_or_slug}'")

    owner, repo = slug_pair
    headers = get_headers()

    # 1. Fetch Repository Info
    repo_resp = requests.get(f"{GITHUB_API_BASE}/repos/{owner}/{repo}", headers=headers, timeout=10)
    if repo_resp.status_code == 404:
        raise ValueError(f"GitHub repository '{owner}/{repo}' not found or is private.")
    if repo_resp.status_code != 200:
        raise ValueError(f"GitHub API returned HTTP {repo_resp.status_code} for '{owner}/{repo}'.")

    repo_data = repo_resp.json()
    full_name = repo_data.get("full_name") or f"{owner}/{repo}"
    language = repo_data.get("language") or "TypeScript"
    stars = int(repo_data.get("stargazers_count", 0))
    default_branch = repo_data.get("default_branch", "main")
    description = repo_data.get("description") or ""

    # 2. Fetch README
    readme_snippet = description
    try:
        readme_resp = requests.get(f"{GITHUB_API_BASE}/repos/{owner}/{repo}/readme", headers=headers, timeout=8)
        if readme_resp.status_code == 200:
            content_b64 = readme_resp.json().get("content", "")
            raw_readme = base64.b64decode(content_b64).decode("utf-8", errors="ignore")
            
            # Clean badges, images, and take the first informative lines
            lines = []
            for line in raw_readme.splitlines():
                line_str = line.strip()
                if not line_str:
                    continue
                # Skip markdown image badges and links
                if line_str.startswith("[![") or line_str.startswith("![") or "shields.io" in line_str:
                    continue
                lines.append(line_str)
                if len("\n".join(lines)) > 1200:
                    break
            if lines:
                readme_snippet = "\n".join(lines[:12])
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
