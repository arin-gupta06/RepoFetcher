"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import RepoForm, { FormValues } from "@/components/RepoForm";
import ResultCard from "@/components/ResultCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface PredictResult {
  top_pattern: string;
  confidence: number;
  top_candidates: Array<{ pattern: string; confidence: number; evidence: string[] }>;
  rationale: string;
  source_tier_hint: string;
  model_info: string;
}

const STATS = [
  { label: "Repositories", value: "66" },
  { label: "Training Pairs", value: "396" },
  { label: "Arch Patterns", value: "52" },
  { label: "Languages", value: "9" },
];

export default function Home() {
  const [result, setResult] = useState<PredictResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOffline, setApiOffline] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setApiOffline(false);

    try {
      const resp = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: values.repoName || "unknown/repo",
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
        throw new Error(`API returned ${resp.status}`);
      }

      const data: PredictResult = await resp.json();
      setResult(data);
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

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }} className="animate-fadeSlideUp">
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
              }}
            />
            Trained on 66 curated repositories
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 1rem",
            }}
          >
            <span className="gradient-text glow-text">Software Architecture</span>
            <br />
            <span style={{ color: "var(--foreground)" }}>Intelligence, Instant.</span>
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              color: "rgba(200,200,230,0.65)",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Enter repository metadata and RepoLens AI will classify the software
            architecture pattern with evidence-backed reasoning.
          </p>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2.5rem",
              marginTop: "2rem",
              flexWrap: "wrap",
            }}
          >
            {STATS.map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offline warning */}
        {apiOffline && (
          <div className="demo-badge animate-fadeIn" style={{ marginBottom: "1.5rem" }}>
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
            }}
          >
            {error}
          </div>
        )}

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "1.75rem",
            alignItems: "start",
          }}
        >
          {/* Form panel */}
          <div className="glass-strong" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>Repository Metadata</h2>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Describe your repository structure</p>
              </div>
            </div>
            <RepoForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Result panel */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>Architecture Analysis</h2>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>AI-powered pattern prediction</p>
              </div>
            </div>
            <ResultCard result={result} isLoading={isLoading} />
          </div>
        </div>

        {/* How it works section */}
        <div style={{ marginTop: "4rem" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
              textAlign: "center",
            }}
          >
            How It Works
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", textAlign: "center", marginBottom: "2rem" }}>
            Three-stage inference pipeline trained on real open-source repositories
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
            {[
              {
                icon: "📦",
                title: "Metadata Extraction",
                desc: "Repository language, frameworks, directory layers, stars, and README content are parsed and normalized.",
              },
              {
                icon: "🧠",
                title: "Pattern Classification",
                desc: "Weighted heuristic classifier maps framework + layer combinations to 52 known architecture patterns.",
              },
              {
                icon: "📊",
                title: "Evidence Ranking",
                desc: "Top-3 candidates are ranked by confidence with supporting evidence from each signal source.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="glass"
                style={{ padding: "1.5rem", textAlign: "center" }}
              >
                <div style={{ fontSize: "2rem", marginBottom: 10 }}>{icon}</div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
