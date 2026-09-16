"use client";

import { useState, useEffect, useRef } from "react";
import TagInput from "./TagInput";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LANGUAGES = ["TypeScript", "JavaScript", "Python", "Go", "Java", "C#", "Rust", "PHP", "Dart"];
const FRAMEWORKS = ["Express", "NestJS", "FastAPI", "Django", "Spring Boot", "Gin", "Axum", "Apollo Server", "GraphQL", "Next.js", "React", "Flutter", "Dapr", "TypeORM", "Fastify", "Koa"];
const LAYERS = ["controllers", "services", "repositories", "models", "infrastructure", "domain", "application", "interfaces", "handlers", "aggregates", "events", "commands", "queries", "resolvers", "schema", "functions"];

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
}

const EXAMPLE_REPOS: Array<{ label: string; values: Partial<FormValues> }> = [
  {
    label: "NestJS Clean Architecture",
    values: {
      repoName: "nestjs/nest",
      language: "TypeScript",
      frameworks: ["NestJS"],
      layers: ["controllers", "services", "repositories", "models", "infrastructure"],
      stars: 68000,
      totalFiles: 210,
      hasArchDocs: true,
      readmeSnippet: "A progressive Node.js framework for building efficient, reliable and scalable server-side applications using clean architecture principles.",
    },
  },
  {
    label: "FastAPI Microservice",
    values: {
      repoName: "tiangolo/fastapi",
      language: "Python",
      frameworks: ["FastAPI"],
      layers: ["handlers", "services", "models"],
      stars: 78000,
      totalFiles: 145,
      hasArchDocs: false,
      readmeSnippet: "FastAPI framework, high performance, easy to learn, fast to code, ready for production.",
    },
  },
  {
    label: "Go Microservices",
    values: {
      repoName: "go-kit/kit",
      language: "Go",
      frameworks: ["Gin"],
      layers: ["services", "models", "infrastructure"],
      stars: 26000,
      totalFiles: 190,
      hasArchDocs: true,
      readmeSnippet: "A toolkit for microservices using Go standard project layout with domain-driven design.",
    },
  },
];

export default function RepoForm({ onSubmit, isLoading }: RepoFormProps) {
  const [values, setValues] = useState<FormValues>({
    repoName: "",
    language: "TypeScript",
    frameworks: [],
    layers: [],
    stars: 0,
    totalFiles: 0,
    hasArchDocs: false,
    readmeSnippet: "",
  });

  const [languages, setLanguages] = useState<string[]>(LANGUAGES);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);
  const lastDetectedRef = useRef<string>("");

  const set = <K extends keyof FormValues>(key: K, val: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const loadExample = (example: Partial<FormValues>) =>
    setValues((prev) => ({ ...prev, ...example }));

  // Debounced auto-detection when user enters / pastes a GitHub URL or repo slug
  useEffect(() => {
    const rawInput = values.repoName.trim();
    if (!rawInput) {
      setDetectStatus(null);
      setDetectError(null);
      return;
    }

    // Match GitHub URL (https://github.com/owner/repo), git@, or owner/repo format
    const isPotentialRepo = (rawInput.includes("/") || rawInput.includes("github.com")) && 
                            !rawInput.endsWith("/") && 
                            rawInput.length >= 3;

    if (!isPotentialRepo) return;
    if (rawInput === lastDetectedRef.current) return;

    const timeoutId = setTimeout(async () => {
      setIsDetecting(true);
      setDetectStatus("Inspecting GitHub repository & detecting signals...");
      setDetectError(null);

      try {
        const res = await fetch(`${API_BASE}/detect-repo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: rawInput }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: "Repository inspection failed" }));
          throw new Error(errData.detail || "Could not inspect repository");
        }

        const data = await res.json();
        lastDetectedRef.current = rawInput;

        // Ensure language is in the dropdown list
        if (data.language) {
          setLanguages((prev) => (prev.includes(data.language) ? prev : [...prev, data.language]));
        }

        // Seamlessly auto-populate all placeholders/inputs in the form
        setValues((prev) => ({
          ...prev,
          repoName: data.repo_name || prev.repoName,
          language: data.language || prev.language,
          stars: typeof data.stars === "number" ? data.stars : prev.stars,
          totalFiles: typeof data.total_files === "number" ? data.total_files : prev.totalFiles,
          frameworks: Array.isArray(data.frameworks) && data.frameworks.length > 0 ? data.frameworks : prev.frameworks,
          layers: Array.isArray(data.layers) && data.layers.length > 0 ? data.layers : prev.layers,
          hasArchDocs: typeof data.has_arch_docs === "boolean" ? data.has_arch_docs : prev.hasArchDocs,
          readmeSnippet: data.readme_snippet || prev.readmeSnippet,
        }));

        setDetectStatus("✓ Auto-populated all fields from GitHub repository signals!");
        setTimeout(() => {
          setDetectStatus((curr) => (curr?.startsWith("✓") ? null : curr));
        }, 4500);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Could not auto-detect repository";
        setDetectError(`Notice: ${msg}. You can still fill fields manually.`);
        setTimeout(() => setDetectError(null), 5000);
      } finally {
        setIsDetecting(false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [values.repoName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--foreground)",
    borderRadius: 10,
    padding: "0.6rem 0.9rem",
    fontSize: "0.9rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "Inter, sans-serif",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Quick examples */}
      <div>
        <p className="section-label" style={{ marginBottom: 8 }}>Quick Examples</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {EXAMPLE_REPOS.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => loadExample(ex.values)}
              className="btn-ghost"
              style={{ fontSize: "0.78rem" }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" style={{ margin: "0" }} />

      {/* Repository name or GitHub URL */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label className="section-label" style={{ margin: 0 }}>
            Repository Name or GitHub URL
          </label>
          {isDetecting && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#a78bfa" }}>
              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
              Auto-detecting...
            </span>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <input
            style={{
              ...inputStyle,
              paddingRight: isDetecting ? "2.5rem" : "0.9rem",
            }}
            placeholder="e.g. expressjs/express or https://github.com/expressjs/express"
            value={values.repoName}
            onChange={(e) => set("repoName", e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        {detectStatus && (
          <div style={{
            marginTop: 6,
            fontSize: "0.75rem",
            color: detectStatus.startsWith("✓") ? "#34d399" : "#a78bfa",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span>{detectStatus}</span>
          </div>
        )}
        {detectError && (
          <div style={{
            marginTop: 6,
            fontSize: "0.75rem",
            color: "#f59e0b",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span>{detectError}</span>
          </div>
        )}
      </div>

      {/* Language + Stars row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="section-label" style={{ display: "block", marginBottom: 6 }}>
            Primary Language
          </label>
          <select
            style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}
            value={values.language}
            onChange={(e) => set("language", e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {languages.map((l) => (
              <option key={l} value={l} style={{ background: "#0f0f23" }}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="section-label" style={{ display: "block", marginBottom: 6 }}>
            Stars
          </label>
          <input
            type="number"
            style={inputStyle}
            placeholder="e.g. 12000"
            min={0}
            value={values.stars || ""}
            onChange={(e) => set("stars", parseInt(e.target.value) || 0)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Total files */}
      <div>
        <label className="section-label" style={{ display: "block", marginBottom: 6 }}>
          Total Files
        </label>
        <input
          type="number"
          style={inputStyle}
          placeholder="e.g. 85"
          min={0}
          value={values.totalFiles || ""}
          onChange={(e) => set("totalFiles", parseInt(e.target.value) || 0)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Frameworks */}
      <TagInput
        label="Frameworks & Libraries"
        placeholder="e.g. Express, NestJS..."
        values={values.frameworks}
        onChange={(v) => set("frameworks", v)}
        suggestions={FRAMEWORKS}
      />

      {/* Layers */}
      <TagInput
        label="Detected Directory Layers"
        placeholder="e.g. controllers, services..."
        values={values.layers}
        onChange={(v) => set("layers", v)}
        suggestions={LAYERS}
      />

      {/* Has architecture docs */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          role="checkbox"
          aria-checked={values.hasArchDocs}
          onClick={() => set("hasArchDocs", !values.hasArchDocs)}
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            border: values.hasArchDocs ? "none" : "2px solid rgba(255,255,255,0.2)",
            background: values.hasArchDocs ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          {values.hasArchDocs && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <span style={{ fontSize: "0.875rem", color: "rgba(200,200,230,0.8)" }}>
          Has architecture documentation (ADRs, diagrams, etc.)
        </span>
      </div>

      {/* README snippet */}
      <div>
        <label className="section-label" style={{ display: "block", marginBottom: 6 }}>
          README Snippet <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional — improves accuracy)</span>
        </label>
        <textarea
          style={{
            ...inputStyle,
            height: 90,
            resize: "vertical",
          }}
          placeholder="Paste the first paragraph of the repository README..."
          value={values.readmeSnippet}
          onChange={(e) => set("readmeSnippet", e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Submit */}
      <button type="submit" className="btn-primary" disabled={isLoading || !values.language}>
        {isLoading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
            <span className="spinner" />
            Analyzing...
          </span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Analyze Architecture
          </span>
        )}
      </button>
    </form>
  );
}
