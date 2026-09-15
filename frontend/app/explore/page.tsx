"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import IdeaForm from "@/components/IdeaForm";
import RepoMatchCard from "@/components/RepoMatchCard";

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

interface AnalysisResult {
  matches: RepoMatch[];
  extracted_signals: Signal;
  total_repos_searched: number;
}

export default function ExplorePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOffline, setApiOffline] = useState(false);
  const [lastIdea, setLastIdea] = useState("");

  const handleSubmit = async (idea: string) => {
    setIsLoading(true);
    setError(null);
    setApiOffline(false);
    setLastIdea(idea);

    try {
      const resp = await fetch(`${API_BASE}/analyze-idea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, top_n: 8 }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody?.detail ?? `API returned ${resp.status}`);
      }

      const data: AnalysisResult = await resp.json();
      setResult(data);

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setApiOffline(true);
        setError("Cannot reach the RepoLens API. Make sure the FastAPI server is running on port 8000.");
      } else {
        setError(err.message ?? "Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const allSignals = result
    ? [
        ...result.extracted_signals.languages,
        ...result.extracted_signals.frameworks,
        ...result.extracted_signals.patterns,
        ...result.extracted_signals.concepts,
      ]
    : [];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }} className="animate-fadeSlideUp">
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: 999,
              padding: "4px 14px",
              fontSize: "0.78rem",
              color: "#c4b5fd",
              fontWeight: 500,
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#7c3aed",
                animation: "pulse-ring 2s infinite",
                display: "inline-block",
              }}
            />
            Searches across {66} curated repositories
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 1rem",
            }}
          >
            <span className="gradient-text glow-text">Explore Ideas,</span>
            <br />
            <span style={{ color: "var(--foreground)" }}>Find Real-World Repos.</span>
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              color: "rgba(200,200,230,0.65)",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Describe your project idea and we'll find the most similar open-source
            repositories from our training dataset — with a match score.
          </p>
        </div>

        {/* ── Idea Entry Form Panel ── */}
        <div
          className="glass-strong"
          style={{
            padding: "2rem 2.25rem",
            marginBottom: "2.5rem",
            maxWidth: 720,
            margin: "0 auto 2.5rem",
          }}
        >
          {/* Panel header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Describe Your Idea</h2>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>
                Plain English — be as specific or general as you like
              </p>
            </div>
          </div>

          <IdeaForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* ── Error / Offline banner ── */}
        {apiOffline && (
          <div className="demo-badge animate-fadeIn" style={{ marginBottom: "1.5rem", maxWidth: 720, margin: "0 auto 1.5rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            API offline — start the FastAPI server:{" "}
            <code
              style={{
                fontFamily: "JetBrains Mono, monospace",
                background: "rgba(245,158,11,0.1)",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              cd api && uvicorn main:app --reload
            </code>
          </div>
        )}

        {error && !apiOffline && (
          <div
            className="animate-fadeIn"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              borderRadius: 10,
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
              maxWidth: 720,
              margin: "0 auto 1.5rem",
            }}
          >
            {error}
          </div>
        )}

        {/* ── Results Section ── */}
        {result && (
          <div id="results-section" className="animate-fadeSlideUp">

            {/* Extracted signals row */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div
                className="glass"
                style={{
                  padding: "1rem 1.4rem",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Detected signals
                  </span>
                </div>
                {allSignals.length === 0 ? (
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>No specific signals — showing general matches</span>
                ) : (
                  allSignals.map((sig) => (
                    <span
                      key={sig}
                      style={{
                        fontSize: "0.78rem",
                        background: "rgba(124,58,237,0.14)",
                        border: "1px solid rgba(124,58,237,0.3)",
                        color: "#c4b5fd",
                        borderRadius: 6,
                        padding: "2px 10px",
                        fontWeight: 500,
                      }}
                    >
                      {sig}
                    </span>
                  ))
                )}
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: "auto" }}>
                  Searched {result.total_repos_searched} repos
                </span>
              </div>
            </div>

            {/* Results header */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {result.matches.length} Similar Repositories Found
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                  Ranked by match score for: <em style={{ color: "rgba(200,200,230,0.7)" }}>"{lastIdea.slice(0, 80)}{lastIdea.length > 80 ? "…" : ""}"</em>
                </p>
              </div>
            </div>

            {/* Cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {result.matches.map((match, i) => (
                <RepoMatchCard
                  key={match.repo_name}
                  {...match}
                  rank={i + 1}
                  animDelay={i * 70}
                />
              ))}
            </div>

            {result.matches.length === 0 && (
              <div
                className="glass"
                style={{ padding: "3rem", textAlign: "center" }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</div>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>No close matches found</p>
                <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  Try adding more specific details — frameworks, language, or architectural keywords.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── How it works (shown when no result yet) ── */}
        {!result && !isLoading && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
              How the matching works
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", maxWidth: 760, margin: "0 auto" }}>
              {[
                {
                  icon: "💡",
                  title: "Describe Your Idea",
                  desc: "Write your project idea in natural language. Include tech stack, purpose, or patterns you have in mind.",
                },
                {
                  icon: "🧠",
                  title: "Signal Extraction",
                  desc: "We extract languages, frameworks, architecture patterns, and domain concepts from your description.",
                },
                {
                  icon: "📊",
                  title: "Match & Rank",
                  desc: "Every repo is scored against your signals and ranked by match percentage for easy exploration.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="glass" style={{ padding: "1.4rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>{icon}</div>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
