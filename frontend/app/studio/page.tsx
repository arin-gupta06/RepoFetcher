"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RepoForm, { FormValues } from "@/components/RepoForm";
import IdeaForm from "@/components/IdeaForm";
import ResultCard from "@/components/ResultCard";
import RepoMatchCard from "@/components/RepoMatchCard";
import type { PredictResult } from "@/types/predict";
import {
  Zap,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  Layers,
  Database,
  Code2,
  GitBranch,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Signal {
  languages: string[];
  frameworks: string[];
  patterns: string[];
  concepts: string[];
}

interface RepoMatch {
  repo_name: string;
  github_url: string;
  language: string;
  stars: number;
  architecture_pattern: string;
  detected_signals: string[];
  match_pct: number;
  rationale: string;
  source_tier: string;
}

interface IdeaAnalysisResult {
  matches: RepoMatch[];
  extracted_signals: Signal;
  total_repos_searched: number;
}

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get("tab") === "explore" ? "explore" : "analyzer";
  const [activeTab, setActiveTab] = useState<"analyzer" | "explore">(initialTab);

  // Analyzer state
  const [analyzerResult, setAnalyzerResult] = useState<PredictResult | null>(null);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);
  const [prefilledFormValues, setPrefilledFormValues] = useState<Partial<FormValues> | undefined>(undefined);

  // Explore Ideas state
  const [ideaResult, setIdeaResult] = useState<IdeaAnalysisResult | null>(null);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [lastSearchedIdea, setLastSearchedIdea] = useState("");

  const [apiOffline, setApiOffline] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "explore" || tabParam === "analyzer") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab: "analyzer" | "explore") => {
    setActiveTab(tab);
    router.replace(`/studio?tab=${tab}`, { scroll: false });
  };

  // ── Handle Analyzer Submit ─────────────────────────────────────────
  const handleAnalyzerSubmit = async (values: FormValues) => {
    setAnalyzerLoading(true);
    setAnalyzerError(null);
    setApiOffline(false);

    try {
      const resp = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: values.repoName || "unknown/custom-system",
          language: values.language,
          frameworks: values.frameworks,
          layers: values.layers,
          stars: values.stars,
          total_files: values.totalFiles,
          has_arch_docs: values.hasArchDocs,
          readme_snippet: values.readmeSnippet,
        }),
      });

      if (!resp.ok) {
        throw new Error(`API returned HTTP ${resp.status}`);
      }

      const data: PredictResult = await resp.json();
      setAnalyzerResult(data);
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setApiOffline(true);
        setAnalyzerError("Cannot reach the RepoLens API backend. Ensure FastAPI is running on port 8000.");
      } else {
        setAnalyzerError(err.message ?? "An unexpected error occurred during prediction.");
      }
    } finally {
      setAnalyzerLoading(false);
    }
  };

  // ── Handle Explore Ideas Submit ─────────────────────────────────────
  const handleIdeaSubmit = async (ideaQuery: string) => {
    setIdeaLoading(true);
    setIdeaError(null);
    setApiOffline(false);
    setLastSearchedIdea(ideaQuery);

    try {
      const resp = await fetch(`${API_BASE}/analyze-idea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: ideaQuery, top_n: 8 }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody?.detail ?? `API returned HTTP ${resp.status}`);
      }

      const data: IdeaAnalysisResult = await resp.json();
      setIdeaResult(data);
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setApiOffline(true);
        setIdeaError("Cannot reach the RepoLens API backend. Ensure FastAPI is running on port 8000.");
      } else {
        setIdeaError(err.message ?? "An unexpected error occurred during idea matching.");
      }
    } finally {
      setIdeaLoading(false);
    }
  };

  // ── Sample Loader for Empty State CTA ────────────────────────────────
  const handleLoadSample = () => {
    const sampleValues: FormValues = {
      repoName: "nestjs/nest",
      language: "TypeScript",
      frameworks: ["NestJS", "Express"],
      layers: ["controllers", "services", "repositories", "models", "infrastructure", "domain"],
      stars: 68000,
      totalFiles: 210,
      hasArchDocs: true,
      readmeSnippet: "A progressive Node.js framework for building efficient, reliable and scalable server-side applications using clean architecture principles.",
    };
    setPrefilledFormValues(sampleValues);
    handleAnalyzerSubmit(sampleValues);
  };

  // ── Bridge: Send matched repo from Explore Ideas to Architecture Analyzer ──
  const handleTransferToAnalyzer = (match: RepoMatch) => {
    setPrefilledFormValues({
      repoName: match.repo_name,
      language: match.language || "TypeScript",
      frameworks: match.detected_signals.filter((s) => !["Clean Architecture", "Microservices", "CQRS"].includes(s)),
      layers: ["controllers", "services", "repositories", "domain"],
      stars: match.stars,
      totalFiles: 120,
      hasArchDocs: true,
      readmeSnippet: match.rationale,
    });
    switchTab("analyzer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const allSignals = ideaResult
    ? [
        ...ideaResult.extracted_signals.languages,
        ...ideaResult.extracted_signals.frameworks,
        ...ideaResult.extracted_signals.patterns,
        ...ideaResult.extracted_signals.concepts,
      ]
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "#000000" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.25rem 5rem" }}>
        {/* ── Studio Header Bar (Fix Issue 5, 9, 10, 15) ── */}
        <div
          style={{
            marginBottom: "1.75rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid #27272a",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
          className="animate-fadeSlideUp"
        >
          {/* Top Row: Title & Badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    margin: 0,
                    color: "#ffffff",
                  }}
                >
                  Architecture <span style={{ color: "#a78bfa" }}>Studio</span>
                </h1>
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: "#1e1136",
                    border: "1px solid #7c3aed",
                    color: "#c4b5fd",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontWeight: 700,
                  }}
                >
                  Neural Classifier
                </span>
              </div>
              <p style={{ color: "#a1a1aa", fontSize: "0.85rem", margin: "4px 0 0" }}>
                Classify repository patterns, inspect modularity telemetry, and discover matching open-source architectures.
              </p>
            </div>

            {/* Fix Issue 5, 9, 10, 15: Left/Integrated Tab Navigation with proper hierarchy & no step numbers */}
            <div
              role="tablist"
              aria-label="Studio Workspace Tabs"
              style={{
                display: "inline-flex",
                background: "#0c0c10",
                border: "1px solid #27272a",
                borderRadius: 8,
                padding: "3px",
                gap: 4,
              }}
            >
              <button
                role="tab"
                aria-selected={activeTab === "analyzer"}
                onClick={() => switchTab("analyzer")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "0.5rem 1.15rem",
                  borderRadius: 6,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: activeTab === "analyzer" ? "#ddd6fe" : "#a1a1aa",
                  background: activeTab === "analyzer" ? "#1e1136" : "transparent",
                  border: activeTab === "analyzer" ? "1px solid #7c3aed" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Zap size={14} color={activeTab === "analyzer" ? "#c4b5fd" : "#71717a"} />
                <span>Architecture Analyzer</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "explore"}
                onClick={() => switchTab("explore")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "0.5rem 1.15rem",
                  borderRadius: 6,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: activeTab === "explore" ? "#93c5fd" : "#a1a1aa",
                  background: activeTab === "explore" ? "#081326" : "transparent",
                  border: activeTab === "explore" ? "1px solid #2563eb" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Lightbulb size={14} color={activeTab === "explore" ? "#60a5fa" : "#71717a"} />
                <span>Explore Ideas</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Offline Banner ── */}
        {apiOffline && (
          <div
            style={{
              padding: "0.85rem 1.25rem",
              background: "#181303",
              border: "1px solid #f59e0b",
              borderRadius: 8,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#fbbf24",
              fontSize: "0.85rem",
            }}
          >
            <AlertTriangle size={18} />
            <div>
              <strong>FastAPI Backend Offline:</strong> Start backend on port 8000 via{" "}
              <code style={{ background: "#000000", border: "1px solid #3f3f46", padding: "2px 6px", borderRadius: 4 }}>
                python -m uvicorn api.main:app --port 8000
              </code>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* VERTICAL STUDIO WORKSPACE FLOW                                */}
        {/* 1. Architecture Controls (Top)                                */}
        {/* 2. Ready to Analyze Architecture Box / Results (Bottom)       */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* ── TOP: ARCHITECTURE CONTROLS / INPUT DECK ────────────────── */}
          <div>
            {activeTab === "analyzer" ? (
              <div>
                <RepoForm
                  onSubmit={handleAnalyzerSubmit}
                  isLoading={analyzerLoading}
                  initialValues={prefilledFormValues}
                />
                {analyzerError && (
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      background: "#1c0709",
                      border: "1px solid #ef4444",
                      borderRadius: 8,
                      marginTop: "1rem",
                      color: "#fca5a5",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AlertTriangle size={16} color="#ef4444" />
                    <span>{analyzerError}</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <IdeaForm onSubmit={handleIdeaSubmit} isLoading={ideaLoading} />
                {ideaError && (
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      background: "#1c0709",
                      border: "1px solid #ef4444",
                      borderRadius: 8,
                      marginTop: "1rem",
                      color: "#fca5a5",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AlertTriangle size={16} color="#ef4444" />
                    <span>{ideaError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── BOTTOM: READY TO ANALYZE BOX & INTELLIGENCE DECK ───────── */}
          <div>
            {activeTab === "analyzer" ? (
              <div>
                <ResultCard
                  result={analyzerResult}
                  isLoading={analyzerLoading}
                  onTrySample={handleLoadSample}
                />
              </div>
            ) : (
              <div>
                {ideaResult ? (
                  <div className="animate-fadeIn">
                    {/* Extracted Signals Card */}
                    <div
                      style={{
                        background: "#0c0c10",
                        border: "2px solid #7c3aed",
                        padding: "1.5rem",
                        borderRadius: 12,
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#a1a1aa", display: "block", marginBottom: 2 }}>
                            Extracted Signals
                          </span>
                          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                            Neural Architecture Signature
                          </h3>
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            background: "#1e1136",
                            color: "#ddd6fe",
                            border: "1px solid #7c3aed",
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontWeight: 700,
                          }}
                        >
                          {ideaResult.total_repos_searched} Benchmarks Searched
                        </span>
                      </div>

                      <p style={{ fontSize: "0.82rem", color: "#a1a1aa", marginBottom: "1rem" }}>
                        Query: &ldquo;{lastSearchedIdea}&rdquo;
                      </p>

                      {/* Signal Chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {allSignals.map((signal, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: "#000000",
                              border: "1px solid #7c3aed",
                              color: "#c4b5fd",
                              borderRadius: 6,
                              padding: "4px 9px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                            }}
                          >
                            <Sparkles size={11} color="#a78bfa" />
                            <span>{signal}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Matches Section Header */}
                    <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                        Top Matching Repositories ({ideaResult.matches.length})
                      </h3>
                    </div>

                    {/* Repo Match Cards Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                        gap: "1.25rem",
                        alignItems: "stretch",
                      }}
                    >
                      {ideaResult.matches.map((match, idx) => (
                        <RepoMatchCard
                          key={match.repo_name}
                          rank={idx + 1}
                          repo_name={match.repo_name}
                          github_url={match.github_url}
                          language={match.language}
                          stars={match.stars}
                          architecture_pattern={match.architecture_pattern}
                          detected_signals={match.detected_signals}
                          match_pct={match.match_pct}
                          rationale={match.rationale}
                          source_tier={match.source_tier}
                          animDelay={idx * 40}
                          onDeepAnalyze={() => handleTransferToAnalyzer(match)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Empty state for Explore Ideas */
                  <div
                    style={{
                      background: "#0c0c10",
                      border: "1px solid #27272a",
                      borderRadius: 12,
                      padding: "3.5rem 2rem",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        background: "#080e1a",
                        border: "1px solid #2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Lightbulb size={28} color="#60a5fa" />
                    </div>
                    <div>
                      <p style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.1rem", marginBottom: 6 }}>
                        Explore Curated Architectural Paradigms
                      </p>
                      <p style={{ color: "#a1a1aa", fontSize: "0.85rem", maxWidth: 380, margin: "0 auto", lineHeight: 1.5 }}>
                        Enter a project concept above or select an example prompt to retrieve matching open-source reference implementations.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000000" }} />}>
      <StudioContent />
    </Suspense>
  );
}
