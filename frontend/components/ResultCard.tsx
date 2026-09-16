"use client";

import { useEffect, useState } from "react";
import type {
  PredictResult,
  TechnicalComponent,
  FunctionalSubdomain,
} from "@/types/predict";

const TIER_LABELS: Record<string, string> = {
  tier_1_template: "Template",
  tier_2_official: "Official Reference",
  tier_3_verified_oss: "Verified OSS",
};

const TIER_COLORS: Record<string, string> = {
  tier_1_template: "#f59e0b",
  tier_2_official: "#10b981",
  tier_3_verified_oss: "#60a5fa",
};

function ConfBar({ value, delay = 0, color }: { value: number; delay?: number; color?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.round(value * 100)), delay + 60);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="conf-bar-track" style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
      <div
        className="conf-bar-fill"
        style={{
          width: `${width}%`,
          height: "100%",
          background: color || "linear-gradient(90deg, #7c3aed, #60a5fa)",
          transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

export default function ResultCard({
  result,
  isLoading,
}: {
  result: PredictResult | null;
  isLoading: boolean;
}) {
  // Progressive disclosure states (choice-driven visibility)
  const [showTechnical, setShowTechnical] = useState(false);
  const [showSubdomains, setShowSubdomains] = useState(false);
  const [showMermaidRaw, setShowMermaidRaw] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [modalDiagramUrl, setModalDiagramUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="glass-strong glow-purple animate-fadeIn" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="skeleton" style={{ height: 28, width: "50%", borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 28, width: "20%", borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ height: 8, width: "100%", borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 60, width: "100%", borderRadius: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          </div>
          <div className="skeleton" style={{ height: 180, width: "100%", borderRadius: 12, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="glass"
        style={{
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
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <p style={{ color: "var(--foreground)", fontWeight: 600, fontSize: "1.1rem", marginBottom: 6 }}>
            Ready to Analyze Architecture
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", maxWidth: 360, margin: "0 auto", lineHeight: 1.5 }}>
            Provide repository layers, frameworks, and context to extract architecture patterns, sub-domains, and closest benchmark matches.
          </p>
        </div>
      </div>
    );
  }

  const tierColor = TIER_COLORS[result.source_tier_hint] ?? "#60a5fa";
  const tierLabel = TIER_LABELS[result.source_tier_hint] ?? result.source_tier_hint;
  const confPct = Math.round(result.confidence * 100);
  const stats = result.analysis_stats;
  const bmStats = result.comparison.benchmark_stats;

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(result.flow_correction.mermaid_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="glass-strong glow-purple animate-fadeSlideUp" style={{ padding: "1.85rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── TOP HEADER & PREDICTION ────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="section-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                Predicted Pattern
              </span>
              <span
                style={{
                  background: `${tierColor}18`,
                  border: `1px solid ${tierColor}40`,
                  color: tierColor,
                  borderRadius: 6,
                  padding: "1px 7px",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                }}
              >
                {tierLabel}
              </span>
            </div>
            <h2 className="gradient-text" style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              {result.top_pattern}
            </h2>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                background: confPct >= 60 ? "linear-gradient(135deg, #a78bfa, #60a5fa)" : "linear-gradient(135deg, #f59e0b, #fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}
            >
              {confPct}%
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>confidence</div>
          </div>
        </div>

        <ConfBar value={result.confidence} />
      </div>

      {/* ── ARCHITECTURE REASONING & RATIONALE ─────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1rem 1.15rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#a78bfa", marginBottom: 6 }}>
          Model Architecture Reasoning
        </p>
        <p
          style={{ fontSize: "0.875rem", color: "rgba(220,220,245,0.85)", lineHeight: 1.65, margin: 0 }}
          dangerouslySetInnerHTML={{
            __html: result.architecture_reasoning.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#fff'>$1</strong>"),
          }}
        />
      </div>

      {/* ── PROGRESSIVE DISCLOSURE TOGGLES (CHOICE-DRIVEN) ──────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Structural Decomposition
          </span>
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
            Subjective inspection options
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Toggle: Technical Plumbing ("What it has") */}
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "0.65rem 0.95rem",
              borderRadius: 10,
              border: showTechnical ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,0.1)",
              background: showTechnical ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
              color: showTechnical ? "#fff" : "rgba(220,220,240,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem" }}>🛠️</span>
              <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                What it Actually Has <span style={{ opacity: 0.65, fontWeight: 400 }}>({result.technical_structure.length} tiers)</span>
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", transform: showTechnical ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>

          {/* Toggle: Business Sub-domains ("What it contains") */}
          <button
            type="button"
            onClick={() => setShowSubdomains(!showSubdomains)}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "0.65rem 0.95rem",
              borderRadius: 10,
              border: showSubdomains ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
              background: showSubdomains ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
              color: showSubdomains ? "#fff" : "rgba(220,220,240,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem" }}>🏢</span>
              <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                What it Contains <span style={{ opacity: 0.65, fontWeight: 400 }}>({result.functional_subdomains.length} domains)</span>
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", transform: showSubdomains ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>
        </div>

        {/* Revealed: Technical Components ("What it actually has") */}
        {showTechnical && (
          <div className="animate-fadeIn" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {result.technical_structure.map((comp) => (
              <div
                key={comp.category}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10,
                  padding: "0.75rem 0.9rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#c4b5fd" }}>{comp.label}</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {comp.items.map((item) => (
                      <span
                        key={item}
                        style={{
                          fontSize: "0.7rem",
                          background: "rgba(124,58,237,0.2)",
                          border: "1px solid rgba(124,58,237,0.3)",
                          color: "#e9d5ff",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontFamily: "monospace",
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>{comp.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Revealed: Functional Subdomains ("What it contains") */}
        {showSubdomains && (
          <div className="animate-fadeIn" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {result.functional_subdomains.map((sub) => (
              <div
                key={sub.name}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10,
                  padding: "0.75rem 0.9rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#93c5fd" }}>{sub.name}</span>
                  <span style={{ fontSize: "0.72rem", color: "#60a5fa", fontWeight: 600 }}>
                    {Math.round(sub.confidence * 100)}% match
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 4px" }}>{sub.description}</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {sub.evidence.map((ev, i) => (
                    <span key={i} style={{ fontSize: "0.68rem", color: "rgba(200,200,240,0.6)", background: "rgba(255,255,255,0.04)", padding: "1px 5px", borderRadius: 3 }}>
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── STATISTICAL VISUAL COMPARISON MATRIX ────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
              Visual Statistical Representation
            </span>
            <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: "2px 0 0" }}>
              Model analysis metrics & comparison against verified reference benchmark
            </p>
          </div>
          <span style={{ fontSize: "0.72rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
            Health Rating: {stats.maintainability_rating}
          </span>
        </div>

        {/* Metric Gauges */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
          {/* Pattern Adherence */}
          <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: "0.76rem", color: "var(--muted)", fontWeight: 500 }}>Pattern Adherence</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa" }}>
                {stats.pattern_adherence_score}%
              </span>
            </div>
            <ConfBar value={stats.pattern_adherence_score / 100} color="linear-gradient(90deg, #7c3aed, #a78bfa)" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "rgba(200,200,230,0.5)", marginTop: 5 }}>
              <span>Input Repo</span>
              <span>Benchmark: {bmStats.pattern_adherence_score}%</span>
            </div>
          </div>

          {/* Modularity Index */}
          <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: "0.76rem", color: "var(--muted)", fontWeight: 500 }}>Modularity Index</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#60a5fa" }}>
                {stats.modularity_index}%
              </span>
            </div>
            <ConfBar value={stats.modularity_index / 100} color="linear-gradient(90deg, #2563eb, #60a5fa)" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "rgba(200,200,230,0.5)", marginTop: 5 }}>
              <span>Coupling: {stats.coupling_risk}</span>
              <span>Benchmark: {bmStats.modularity_index}%</span>
            </div>
          </div>
        </div>

        {/* Layer Distribution Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--muted)", marginBottom: 6 }}>
            <span>Architectural Layer Distribution</span>
            <span>Presentation / Logic / Persistence / Infra</span>
          </div>

          {/* Input Repo Distribution */}
          <div style={{ height: 10, borderRadius: 6, overflow: "hidden", display: "flex", gap: 1, marginBottom: 4, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ width: `${stats.layer_distribution.presentation}%`, background: "#a855f7" }} title={`Presentation: ${stats.layer_distribution.presentation}%`} />
            <div style={{ width: `${stats.layer_distribution.business_logic}%`, background: "#3b82f6" }} title={`Business Logic: ${stats.layer_distribution.business_logic}%`} />
            <div style={{ width: `${stats.layer_distribution.persistence}%`, background: "#10b981" }} title={`Persistence: ${stats.layer_distribution.persistence}%`} />
            <div style={{ width: `${stats.layer_distribution.infrastructure}%`, background: "#f59e0b" }} title={`Infrastructure: ${stats.layer_distribution.infrastructure}%`} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, fontSize: "0.68rem", color: "rgba(200,200,230,0.6)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7" }} /> Presentation: {stats.layer_distribution.presentation}%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} /> Logic: {stats.layer_distribution.business_logic}%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} /> Persistence: {stats.layer_distribution.persistence}%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} /> Infra: {stats.layer_distribution.infrastructure}%
            </span>
          </div>
        </div>

        {/* Statistical delta summary */}
        <div style={{ marginTop: 12, padding: "0.6rem 0.8rem", background: "rgba(124,58,237,0.07)", borderRadius: 8, fontSize: "0.75rem", color: "rgba(220,220,250,0.8)", lineHeight: 1.5 }}>
          {result.comparison.summary}
        </div>
      </div>

      {/* ── CLOSEST BENCHMARK MATCH REPOSITORY ──────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span className="section-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
            Closest Benchmark Match
          </span>
          <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>
            {Math.round(result.closest_match.similarity_score * 100)}% architectural similarity
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#fff" }}>
                {result.closest_match.full_name}
              </h3>
              <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.06)", padding: "1px 7px", borderRadius: 4, color: "var(--muted)" }}>
                ★ {result.closest_match.stars.toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "4px 0 0" }}>
              Owner: <strong>{result.closest_match.owner}</strong> • Pattern: <strong>{result.closest_match.pattern}</strong>
            </p>
          </div>

          <a
            href={result.closest_match.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(124,58,237,0.2)",
              border: "1px solid rgba(124,58,237,0.4)",
              color: "#c4b5fd",
              padding: "0.45rem 0.95rem",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            <span>View on GitHub</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── RECOMMENDED ARCHITECTURE DIAGRAM (PRUNED & HOSTED) ────────────── */}
      {result.recommended_diagram && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <span className="section-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                Recommended Architecture Diagram
              </span>
              <p style={{ fontSize: "0.78rem", color: "rgba(220,220,245,0.9)", margin: "2px 0 0", fontWeight: 600 }}>
                {result.recommended_diagram.caption}
              </p>
            </div>
            <span style={{ fontSize: "0.7rem", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
              {result.recommended_diagram.diagram_type.replace("_", " ")}
            </span>
          </div>

          <div
            onClick={() => setModalDiagramUrl(result.recommended_diagram?.storage_url || null)}
            style={{
              position: "relative",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0d0d1e",
              cursor: "zoom-in",
              maxHeight: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.recommended_diagram.storage_url}
              alt={result.recommended_diagram.caption}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: 280,
                objectFit: "contain",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(6px)",
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: "0.7rem",
                color: "#c4b5fd",
              }}
            >
              Click to Expand ⤢
            </div>
          </div>
        </div>
      )}

      {/* ── CORRECTED FLOW & RECOMMENDATIONS ──────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span className="section-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
            Corrected Flow & Recommendations
          </span>
          <button
            type="button"
            onClick={handleCopyMermaid}
            style={{
              background: copiedCode ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: copiedCode ? "#10b981" : "var(--foreground)",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: "0.72rem",
              cursor: "pointer",
            }}
          >
            {copiedCode ? "✓ Copied Diagram" : "Copy Mermaid Flow"}
          </button>
        </div>

        {/* Actionable Recommendations */}
        <div style={{ marginBottom: "1rem" }}>
          {result.flow_correction.recommendations.map((rec, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#10b981", fontSize: "0.9rem", lineHeight: 1.2 }}>✓</span>
              <span style={{ fontSize: "0.82rem", color: "rgba(220,220,245,0.9)", lineHeight: 1.5 }}>
                {rec}
              </span>
            </div>
          ))}
        </div>

        {/* Mermaid Sequence Code / Viewer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
              Recommended Sequence Flow (Mermaid)
            </span>
            <button
              type="button"
              onClick={() => setShowMermaidRaw(!showMermaidRaw)}
              style={{
                background: "transparent",
                border: "none",
                color: "#a78bfa",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              {showMermaidRaw ? "Hide Syntax" : "Show Syntax"}
            </button>
          </div>

          {showMermaidRaw && (
            <pre
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "0.75rem",
                fontSize: "0.72rem",
                color: "#c4b5fd",
                fontFamily: "monospace",
                overflowX: "auto",
                margin: 0,
                maxHeight: 200,
              }}
            >
              {result.flow_correction.mermaid_code}
            </pre>
          )}
        </div>
      </div>

      {/* ── FOOTNOTE ──────────────────────────────────────────────────────── */}
      <div style={{ fontSize: "0.7rem", color: "var(--muted)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {result.model_info}
      </div>

      {/* ── LIGHTBOX MODAL FOR DIAGRAM ────────────────────────────────────── */}
      {modalDiagramUrl && (
        <div
          onClick={() => setModalDiagramUrl(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "2rem",
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={modalDiagramUrl}
            alt="Expanded Diagram"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 12,
              boxShadow: "0 0 40px rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "#111",
            }}
          />
        </div>
      )}
    </div>
  );
}
