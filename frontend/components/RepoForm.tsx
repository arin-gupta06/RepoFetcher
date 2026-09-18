"use client";

import { useState, useEffect } from "react";
import TagInput from "./TagInput";
import {
  FileText,
  MessageSquare,
  Zap,
  Search,
  RefreshCw,
  Loader2,
  Lightbulb,
  CheckCircle2,
  Sliders,
  Sparkles,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LANGUAGES = ["TypeScript", "JavaScript", "Python", "Go", "Java", "C#", "Rust", "PHP", "Dart", "Kotlin", "C++"];
const FRAMEWORKS = [
  "Express", "NestJS", "FastAPI", "Django", "Spring Boot", "Gin", "Axum",
  "Apollo Server", "GraphQL", "Next.js", "React", "Flutter", "Dapr", "TypeORM", "Fastify", "Koa", "ASP.NET Core"
];
const LAYERS = [
  "controllers", "services", "repositories", "models", "infrastructure", "domain",
  "application", "interfaces", "handlers", "aggregates", "events", "commands", "queries",
  "resolvers", "schema", "functions", "middleware", "ports", "adapters"
];

export interface FormValues {
  repoName: string;
  language: string;
  frameworks: string[];
  layers: string[];
  stars: number;
  totalFiles: number;
  hasArchDocs: boolean;
  readmeSnippet: string;
}

interface RepoFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
  initialValues?: Partial<FormValues>;
}

const EXAMPLE_REPOS: Array<{ label: string; values: Partial<FormValues> }> = [
  {
    label: "NestJS Clean Arch",
    values: {
      repoName: "nestjs/nest",
      language: "TypeScript",
      frameworks: ["NestJS"],
      layers: ["controllers", "services", "repositories", "models", "infrastructure", "domain"],
      stars: 68000,
      totalFiles: 210,
      hasArchDocs: true,
      readmeSnippet: "A progressive Node.js framework for building efficient, reliable and scalable server-side applications using clean architecture principles.",
    },
  },
  {
    label: "FastAPI Microservices",
    values: {
      repoName: "tiangolo/fastapi",
      language: "Python",
      frameworks: ["FastAPI"],
      layers: ["handlers", "services", "models", "infrastructure"],
      stars: 78000,
      totalFiles: 145,
      hasArchDocs: false,
      readmeSnippet: "FastAPI framework, high performance, easy to learn, fast to code, ready for production.",
    },
  },
  {
    label: "Go-Kit Microservices",
    values: {
      repoName: "go-kit/kit",
      language: "Go",
      frameworks: ["Gin"],
      layers: ["services", "models", "infrastructure", "adapters"],
      stars: 26000,
      totalFiles: 190,
      hasArchDocs: true,
      readmeSnippet: "A toolkit for microservices using Go standard project layout with domain-driven design.",
    },
  },
  {
    label: "Spring Boot Hexagonal",
    values: {
      repoName: "spring-projects/spring-boot",
      language: "Java",
      frameworks: ["Spring Boot"],
      layers: ["controllers", "services", "repositories", "domain", "ports", "adapters"],
      stars: 74000,
      totalFiles: 480,
      hasArchDocs: true,
      readmeSnippet: "Spring Boot helps you to create stand-alone, production-grade Spring based Applications.",
    },
  },
];

const DIALOGUE_STARTERS = [
  {
    title: "Microservices & Distributed",
    prompt: "I am designing a high-throughput microservices architecture in Go using Gin, gRPC communication, Redis distributed caching, and PostgreSQL. It has distinct service layers, event streaming handlers, and an infrastructure gateway.",
  },
  {
    title: "Clean Architecture Backend",
    prompt: "Analyzing a TypeScript backend built with NestJS and TypeORM. The project is organized into domain aggregates, application use-cases/services, interface controllers, and database repositories following strict Clean Architecture boundaries.",
  },
  {
    title: "Hexagonal / Ports & Adapters",
    prompt: "Evaluating a Python FastAPI application structured with Hexagonal Architecture. Core business logic lives in domain models without external dependencies, while ports and adapters handle HTTP routes and PostgreSQL database persistence.",
  },
  {
    title: "CQRS & Event-Driven System",
    prompt: "A distributed banking transaction service in C# with ASP.NET Core using CQRS pattern. Separation of command handlers, query resolvers, event store aggregates, and event handlers for auditing.",
  },
];

export default function RepoForm({ onSubmit, isLoading, initialValues }: RepoFormProps) {
  const [viewMode, setViewMode] = useState<"form" | "dialogue">("form");

  const [values, setValues] = useState<FormValues>({
    repoName: initialValues?.repoName ?? "",
    language: initialValues?.language ?? "TypeScript",
    frameworks: initialValues?.frameworks ?? [],
    layers: initialValues?.layers ?? [],
    stars: initialValues?.stars ?? 0,
    totalFiles: initialValues?.totalFiles ?? 0,
    hasArchDocs: initialValues?.hasArchDocs ?? false,
    readmeSnippet: initialValues?.readmeSnippet ?? "",
  });

  const [dialogueText, setDialogueText] = useState(
    "A scalable Go microservice using Gin framework, domain-driven services, repositories for Postgres, and Redis caching. It includes an architecture.md document and handles high concurrency."
  );

  const [githubUrl, setGithubUrl] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const [statusTimer, setStatusTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialValues) {
      setValues((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const showStatus = (msg: string) => {
    if (statusTimer) clearTimeout(statusTimer);
    setDetectStatus(msg);
    const t = setTimeout(() => setDetectStatus(null), 5000);
    setStatusTimer(t);
  };

  const parseSignalsFromDialogue = (text: string): FormValues => {
    const lower = text.toLowerCase();

    let detectedLang = "TypeScript";
    for (const l of LANGUAGES) {
      if (lower.includes(l.toLowerCase())) {
        detectedLang = l;
        break;
      }
    }

    const detectedFrameworks = FRAMEWORKS.filter((f) =>
      lower.includes(f.toLowerCase())
    );

    const detectedLayers = LAYERS.filter((l) =>
      lower.includes(l.toLowerCase())
    );

    const hasDocs = lower.includes("arch") || lower.includes("docs") || lower.includes("architecture.md") || lower.includes("documentation");
    const inferredStars = lower.includes("enterprise") || lower.includes("popular") ? 2500 : 350;
    const inferredFiles = detectedLayers.length > 3 ? 120 : 45;

    const repoMatch = text.match(/(?:github\.com\/|repo(?:\s+name)?:\s*|\b)([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/i);
    const repoName = repoMatch ? repoMatch[1] : (values.repoName || "custom/architecture-repo");

    return {
      repoName,
      language: detectedLang,
      frameworks: detectedFrameworks.length > 0 ? detectedFrameworks : (values.frameworks.length > 0 ? values.frameworks : ["Express"]),
      layers: detectedLayers.length > 0 ? detectedLayers : (values.layers.length > 0 ? values.layers : ["controllers", "services", "repositories"]),
      stars: values.stars || inferredStars,
      totalFiles: values.totalFiles || inferredFiles,
      hasArchDocs: hasDocs,
      readmeSnippet: text.slice(0, 1200),
    };
  };

  const handleDialogueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogueText.trim() || isLoading) return;
    const parsed = parseSignalsFromDialogue(dialogueText);
    setValues(parsed);
    onSubmit(parsed);
  };

  const handleConvertToForm = () => {
    const parsed = parseSignalsFromDialogue(dialogueText);
    setValues(parsed);
    setViewMode("form");
    showStatus("Extracted architecture parameters into form fields.");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onSubmit(values);
  };

  const handleGithubDetect = async () => {
    if (!githubUrl.trim()) return;
    setIsDetecting(true);
    setDetectStatus(null);

    try {
      const resp = await fetch(`${API_BASE}/detect-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url: githubUrl.trim() }),
      });

      if (!resp.ok) {
        throw new Error(`API returned ${resp.status}`);
      }

      const data = await resp.json();
      setValues((prev) => ({
        ...prev,
        repoName: data.repo_name ?? prev.repoName,
        language: data.language ?? prev.language,
        frameworks: data.frameworks?.length ? data.frameworks : prev.frameworks,
        layers: data.layers?.length ? data.layers : prev.layers,
        stars: data.stars ?? prev.stars,
        totalFiles: data.total_files ?? prev.totalFiles,
        hasArchDocs: data.has_arch_docs ?? prev.hasArchDocs,
        readmeSnippet: data.readme_snippet ?? prev.readmeSnippet,
      }));

      setDialogueText(
        `Repository: ${data.repo_name}\nPrimary Language: ${data.language}\nFrameworks: ${(data.frameworks || []).join(", ")}\nLayers: ${(data.layers || []).join(", ")}\nStars: ${data.stars} | Files: ${data.total_files} | Arch Docs: ${data.has_arch_docs ? "Yes" : "No"}\n\nReadme Summary:\n${data.readme_snippet || "No description provided."}`
      );

      showStatus(`Imported ${data.repo_name} from GitHub!`);
    } catch {
      showStatus("Could not fetch repo automatically. You can fill the fields manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  const applyPreset = (preset: (typeof EXAMPLE_REPOS)[0]) => {
    setValues((prev) => ({ ...prev, ...preset.values }));
    setDialogueText(
      `Repository: ${preset.values.repoName}\nPrimary Language: ${preset.values.language}\nFrameworks: ${preset.values.frameworks?.join(", ")}\nLayers: ${preset.values.layers?.join(", ")}\nDescription:\n${preset.values.readmeSnippet}`
    );
  };

  const insertTagToDialogue = (tag: string) => {
    setDialogueText((prev) => `${prev.trim()} ${tag}`);
  };

  return (
    <div
      style={{
        background: "#0c0c10",
        border: "2px solid #7c3aed",
        borderRadius: 12,
        padding: "1.5rem",
      }}
    >
      {/* Top Bar: Mode Toggle Header (Fix Issue 7: Prominent Segmented Control) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #27272a",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sliders size={17} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
              Architecture Controls
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "#a1a1aa", margin: 0 }}>
              Structured fields or conversational dialogue
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Fix Issue 7: Clear Segmented View Switcher */}
          <div
            role="tablist"
            aria-label="Input Mode Switcher"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#000000",
              border: "1px solid #27272a",
              padding: "3px",
              borderRadius: 8,
              gap: 2,
            }}
          >
            <button
              role="tab"
              aria-selected={viewMode === "form"}
              type="button"
              onClick={() => setViewMode("form")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: viewMode === "form" ? "#ffffff" : "#a1a1aa",
                background: viewMode === "form" ? "#7c3aed" : "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.15s ease",
              }}
            >
              <FileText size={14} />
              <span>Structured Form</span>
            </button>

            <button
              role="tab"
              aria-selected={viewMode === "dialogue"}
              type="button"
              onClick={() => setViewMode("dialogue")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: viewMode === "dialogue" ? "#ffffff" : "#a1a1aa",
                background: viewMode === "dialogue" ? "#7c3aed" : "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.15s ease",
              }}
            >
              <MessageSquare size={14} />
              <span>Dialogue Box</span>
            </button>
          </div>

          {/* Fix Issue 6: Quick Top Run Action */}
          {viewMode === "form" && (
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isLoading}
              style={{
                background: "#130a24",
                border: "1px solid #7c3aed",
                color: "#ddd6fe",
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              <span>Run</span>
            </button>
          )}
        </div>
      </div>

      {detectStatus && (
        <div
          style={{
            padding: "8px 12px",
            marginBottom: "1.25rem",
            borderRadius: 8,
            fontSize: "0.8125rem",
            fontWeight: 600,
            background: "#061510",
            border: "1px solid #10b981",
            color: "#34d399",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{detectStatus}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 1: WRITING DIALOGUE BOX                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === "dialogue" && (
        <form onSubmit={handleDialogueSubmit} className="animate-fadeIn">
          {/* Quick Dialogue Starters */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Lightbulb size={14} color="#a78bfa" />
              <span style={{ fontSize: "0.8125rem", color: "#d4d4d8", fontWeight: 700 }}>
                Sample Architecture Prompts
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DIALOGUE_STARTERS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDialogueText(s.prompt)}
                  style={{
                    background: "#000000",
                    border: "1px solid #27272a",
                    borderRadius: 8,
                    padding: "8px 12px",
                    textAlign: "left",
                    color: "#f4f4f5",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#27272a")}
                >
                  <strong style={{ display: "block", color: "#ffffff", fontSize: "0.8125rem" }}>{s.title}</strong>
                  <span style={{ color: "#a1a1aa", fontSize: "0.75rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                    {s.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dialogue Textarea */}
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <textarea
              rows={7}
              value={dialogueText}
              onChange={(e) => setDialogueText(e.target.value)}
              placeholder="Describe your software system architecture in natural language..."
              style={{
                width: "100%",
                background: "#000000",
                border: "1px solid #3f3f46",
                color: "#f4f4f5",
                borderRadius: 8,
                padding: "0.9rem 1rem",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                fontFamily: "var(--font-mono, monospace), monospace",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
              onBlur={(e) => (e.target.style.borderColor = "#3f3f46")}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontSize: "0.78rem",
                color: "#a1a1aa",
                fontWeight: 500,
              }}
            >
              <span>{dialogueText.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>Accepts repo URLs, stack lists, and descriptions</span>
            </div>
          </div>

          {/* Quick Tag Injectors */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                "NestJS", "FastAPI", "Go / Gin", "Clean Architecture", "Microservices", "PostgreSQL"
              ].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => insertTagToDialogue(name)}
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    padding: "4px 9px",
                    borderRadius: 6,
                    background: "#000000",
                    border: "1px solid #27272a",
                    color: "#f4f4f5",
                    cursor: "pointer",
                  }}
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons for Dialogue */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isLoading || !dialogueText.trim()}
              style={{
                flex: 1,
                minWidth: 160,
                padding: "0.75rem 1.25rem",
                borderRadius: 8,
                background: "#7c3aed",
                border: "1px solid #8b5cf6",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.875rem",
                cursor: isLoading || !dialogueText.trim() ? "not-allowed" : "pointer",
                opacity: isLoading || !dialogueText.trim() ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Predicting...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Run Architecture Intelligence</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleConvertToForm}
              style={{
                padding: "0.75rem 1.1rem",
                borderRadius: 8,
                background: "#18181b",
                border: "1px solid #3f3f46",
                color: "#e4e4e7",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} />
              <span>Convert to Form</span>
            </button>
          </div>
        </form>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 2: STRUCTURED FORM                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === "form" && (
        <form onSubmit={handleFormSubmit} className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Fix Issue 8: Section 1 — Quick Import & Presets */}
          <div style={{ background: "#000000", border: "1px solid #27272a", borderRadius: 8, padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#d4d4d8" }}>
                1. GitHub Direct Import &amp; Presets
              </span>
            </div>

            {/* GitHub Import Bar (Fix Issue 13: Neutral Fetch Button) */}
            <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem" }}>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="e.g. https://github.com/expressjs/express"
                style={{
                  flex: 1,
                  height: 40,
                  boxSizing: "border-box",
                  background: "#0c0c10",
                  border: "1px solid #3f3f46",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "0 0.75rem",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleGithubDetect}
                disabled={isDetecting || !githubUrl.trim()}
                style={{
                  height: 40,
                  padding: "0 1.1rem",
                  borderRadius: 8,
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: isDetecting || !githubUrl.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {isDetecting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Fetch</span>
              </button>
            </div>

            {/* Preset Buttons (Fix Issue 14: Single Neutral Border & Clear Labeling) */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EXAMPLE_REPOS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: 6,
                    background: "#0c0c10",
                    border: "1px solid #27272a",
                    color: "#e4e4e7",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#27272a")}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Repository Identity & Core Tech Stack */}
          <div style={{ background: "#000000", border: "1px solid #27272a", borderRadius: 8, padding: "1rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#d4d4d8", display: "block", marginBottom: "0.75rem" }}>
              2. Repository Identity &amp; Frameworks
            </span>

            {/* Repo Name & Language (Fix Issue 11: Standardized 40px Height) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                  Repository Name
                </label>
                <input
                  type="text"
                  value={values.repoName}
                  onChange={(e) => setValues({ ...values, repoName: e.target.value })}
                  placeholder="owner/repo-name"
                  style={{
                    width: "100%",
                    height: 40,
                    boxSizing: "border-box",
                    background: "#0c0c10",
                    border: "1px solid #3f3f46",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "0 0.75rem",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                  Primary Language
                </label>
                <select
                  value={values.language}
                  onChange={(e) => setValues({ ...values, language: e.target.value })}
                  style={{
                    width: "100%",
                    height: 40,
                    boxSizing: "border-box",
                    background: "#0c0c10",
                    border: "1px solid #3f3f46",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "0 0.75rem",
                    fontSize: "0.85rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l} style={{ background: "#000000", color: "#f4f4f5" }}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Frameworks Tag Input */}
            <TagInput
              label="Frameworks & Libraries"
              tags={values.frameworks}
              onChange={(frameworks) => setValues({ ...values, frameworks })}
              suggestions={FRAMEWORKS}
              placeholder="e.g. Express, NestJS, FastAPI..."
            />
          </div>

          {/* Section 3: Architectural Layers & Signals */}
          <div style={{ background: "#000000", border: "1px solid #27272a", borderRadius: 8, padding: "1rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#d4d4d8", display: "block", marginBottom: "0.75rem" }}>
              3. Architectural Layers &amp; Metadata
            </span>

            {/* Layers Tag Input */}
            <div style={{ marginBottom: "0.85rem" }}>
              <TagInput
                label="Architectural Directory Layers"
                tags={values.layers}
                onChange={(layers) => setValues({ ...values, layers })}
                suggestions={LAYERS}
                placeholder="e.g. controllers, services, domain, repositories..."
              />
            </div>

            {/* Numeric stats & Arch Docs (Fix Issue 11 & Issue 12: Uniform 40px grid alignment) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                  Stars
                </label>
                <input
                  type="number"
                  min="0"
                  value={values.stars}
                  onChange={(e) => setValues({ ...values, stars: Math.max(0, parseInt(e.target.value) || 0) })}
                  style={{
                    width: "100%",
                    height: 40,
                    boxSizing: "border-box",
                    background: "#0c0c10",
                    border: "1px solid #3f3f46",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "0 0.75rem",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                  Files Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={values.totalFiles}
                  onChange={(e) => setValues({ ...values, totalFiles: Math.max(0, parseInt(e.target.value) || 0) })}
                  style={{
                    width: "100%",
                    height: 40,
                    boxSizing: "border-box",
                    background: "#0c0c10",
                    border: "1px solid #3f3f46",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "0 0.75rem",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Fix Issue 12: Clear well-aligned checkbox card */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    cursor: "pointer",
                    height: 40,
                    boxSizing: "border-box",
                    padding: "0 0.85rem",
                    background: "#0c0c10",
                    borderRadius: 8,
                    border: "1px solid #3f3f46",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={values.hasArchDocs}
                    onChange={(e) => setValues({ ...values, hasArchDocs: e.target.checked })}
                    style={{ accentColor: "#7c3aed", width: 16, height: 16 }}
                  />
                  <span>Has Arch Docs</span>
                </label>
              </div>
            </div>

            {/* README Snippet */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                README / Blueprint Snippet
              </label>
              <textarea
                rows={3}
                value={values.readmeSnippet}
                onChange={(e) => setValues({ ...values, readmeSnippet: e.target.value })}
                placeholder="Paste repository summary or README excerpt..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#0c0c10",
                  border: "1px solid #3f3f46",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "0.6rem 0.75rem",
                  fontSize: "0.82rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Primary Action Button (Bottom) */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              height: 44,
              padding: "0 1.25rem",
              borderRadius: 8,
              background: "#7c3aed",
              border: "1px solid #8b5cf6",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Running Architecture Analysis...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Run Architecture Intelligence</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
