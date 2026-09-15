"use client";

import { useEffect, useState } from "react";

interface Candidate {
  pattern: string;
  confidence: number;
  evidence: string[];
}

interface PredictResult {
  top_pattern: string;
  confidence: number;
  top_candidates: Candidate[];
  rationale: string;
  source_tier_hint: string;
  model_info: string;
}

const TIER_LABELS: Record<string, string> = {
  tier_1_template: "Template",
  tier_2_official: "Official",
  tier_3_verified_oss: "Verified OSS",
};

const TIER_COLORS: Record<string, string> = {
  tier_1_template: "#f59e0b",
  tier_2_official: "#10b981",
  tier_3_verified_oss: "#60a5fa",
};

function ConfBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.round(value * 100)), delay + 80);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="conf-bar-track" style={{ flex: 1 }}>
      <div className="conf-bar-fill" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function ResultCard({ result, isLoading }: { result: PredictResult | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="glass-strong glow-purple animate-fadeIn" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="skeleton" style={{ height: 28, width: "60%" }} />
          <div className="skeleton" style={{ height: 16, width: "85%" }} />
          <div className="skeleton" style={{ height: 16, width: "70%" }} />
          <div style={{ marginTop: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div className="skeleton" style={{ height: 14, width: "40%" }} />
                <div className="skeleton" style={{ height: 6, flex: 1 }} />
                <div className="skeleton" style={{ height: 14, width: 40 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="glass"
        style={{
          padding: "3rem 2rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <p style={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 6 }}>
            Ready to analyze
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Fill in the repository metadata and click <strong>Analyze Architecture</strong>
          </p>
        </div>
      </div>
    );
  }

  const tierColor = TIER_COLORS[result.source_tier_hint] ?? "#60a5fa";
  const tierLabel = TIER_LABELS[result.source_tier_hint] ?? result.source_tier_hint;
  const confPct = Math.round(result.confidence * 100);

  return (
    <div className="glass-strong glow-purple animate-fadeSlideUp" style={{ padding: "1.75rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: "1.25rem" }}>
        <div style={{ flex: 1 }}>
          <p className="section-label" style={{ marginBottom: 6 }}>Top Prediction</p>
          <h2
            className="gradient-text"
            style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}
          >
            {result.top_pattern}
          </h2>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              background: confPct >= 60 ? "linear-gradient(135deg, #a78bfa, #60a5fa)" : "linear-gradient(135deg, #f59e0b, #fb923c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}
          >
            {confPct}%
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 2 }}>confidence</div>
        </div>
      </div>

      {/* Overall confidence bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <ConfBar value={result.confidence} />
      </div>

      {/* Tier badge */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <span
          style={{
            background: `${tierColor}18`,
            border: `1px solid ${tierColor}40`,
            color: tierColor,
            borderRadius: 6,
            padding: "2px 10px",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {tierLabel}
        </span>
        <span className="tag">RepoLens AI v1</span>
      </div>

      <div className="divider" style={{ margin: "1rem 0" }} />

      {/* Top-3 candidates */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Top Candidates</p>
        {result.top_candidates.map((c, i) => (
          <div key={c.pattern} className="animate-fadeSlideUp" style={{ marginBottom: 14, animationDelay: `${i * 80}ms` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: i === 0 ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.06)",
                  color: i === 0 ? "#fff" : "var(--muted)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: "0.875rem",
                  fontWeight: i === 0 ? 600 : 400,
                  color: i === 0 ? "var(--foreground)" : "rgba(200,200,230,0.7)",
                }}
              >
                {c.pattern}
              </span>
              <ConfBar value={c.confidence} delay={i * 80} />
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", minWidth: 36, textAlign: "right" }}>
                {Math.round(c.confidence * 100)}%
              </span>
            </div>
            {c.evidence.length > 0 && (
              <div style={{ marginLeft: 30, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {c.evidence.slice(0, 2).map((ev) => (
                  <span
                    key={ev}
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--muted)",
                      background: "rgba(255,255,255,0.04)",
                      padding: "1px 7px",
                      borderRadius: 4,
                    }}
                  >
                    {ev}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="divider" style={{ margin: "1rem 0" }} />

      {/* Rationale */}
      <div style={{ marginBottom: "1rem" }}>
        <p className="section-label" style={{ marginBottom: 8 }}>Rationale</p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "rgba(200,200,230,0.75)",
            lineHeight: 1.65,
          }}
          dangerouslySetInnerHTML={{
            __html: result.rationale.replace(/\*\*(.*?)\*\*/g, "<strong style='color:var(--foreground)'>$1</strong>"),
          }}
        />
      </div>

      {/* Model info footnote */}
      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--muted)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "0.75rem",
          marginTop: "0.5rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {result.model_info}
      </div>
    </div>
  );
}
