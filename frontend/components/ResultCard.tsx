"use client";

import { useEffect, useState } from "react";
import type {
  PredictResult,
  TechnicalComponent,
  FunctionalSubdomain,
} from "@/types/predict";
import {
  Wrench,
  Building2,
  Check,
  Star,
  Maximize2,
  ChevronDown,
  Copy,
  CheckCircle2,
  ExternalLink,
  Code2,
  Info,
  Search,
  Layers,
  Zap,
} from "lucide-react";

const TIER_LABELS: Record<string, string> = {
  tier_1_template: "Template",
  tier_2_official: "Official Reference",
  tier_3_verified_oss: "Verified OSS",
};

const TIER_COLORS: Record<string, string> = {
  tier_1_template: "#f59e0b",
  tier_2_official: "#10b981",
  tier_3_verified_oss: "#2563eb",
};

function ConfBar({ value, delay = 0, color }: { value: number; delay?: number; color?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.round(value * 100)), delay + 60);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="conf-bar-track" style={{ flex: 1, height: 8, background: "#18181b", borderRadius: 999, overflow: "hidden" }}>
      <div
        className="conf-bar-fill"
        style={{
          width: `${width}%`,
          height: "100%",
          background: color || "#7c3aed",
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

export default function ResultCard({
  result,
  isLoading,
  onTrySample,
}: {
  result: PredictResult | null;
  isLoading: boolean;
  onTrySample?: () => void;
}) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [showSubdomains, setShowSubdomains] = useState(false);
  const [showMermaidRaw, setShowMermaidRaw] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [modalDiagramUrl, setModalDiagramUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div
        style={{
          background: "#0c0c10",
          border: "2px solid #7c3aed",
          borderRadius: 12,
          padding: "2rem",
        }}
        className="animate-fadeIn"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="skeleton" style={{ height: 28, width: "50%", borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 28, width: "20%", borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ height: 8, width: "100%", borderRadius: 9999 }} />
          <div className="skeleton" style={{ height: 60, width: "100%", borderRadius: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
          </div>
          <div className="skeleton" style={{ height: 180, width: "100%", borderRadius: 8, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        style={{
          background: "#0c0c10",
          border: "1px solid #27272a",
          borderRadius: 12,
          padding: "3rem 2rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Fix Issue 4: Replace generic Search icon with domain-specific Layers icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            background: "#130a24",
            border: "1px solid #7c3aed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Layers size={30} color="#a78bfa" strokeWidth={2} />
        </div>
        <div>
          <p style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.1rem", marginBottom: 6 }}>
            Ready to Analyze Architecture
          </p>
          <p style={{ color: "#a1a1aa", fontSize: "0.85rem", maxWidth: 420, margin: "0 auto 1.25rem", lineHeight: 1.5 }}>
            Provide repository layers, frameworks, and context on the left or use dialogue mode to extract architecture patterns and benchmark matches.
          </p>
          {/* Fix Issue 3: Added interactive Primary CTA button */}
          {onTrySample && (
            <button
              type="button"
              onClick={onTrySample}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "#7c3aed",
                color: "#ffffff",
                border: "1px solid #8b5cf6",
                padding: "0.6rem 1.3rem",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Zap size={15} />
              <span>Load Sample Architecture</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const tierColor = TIER_COLORS[result.source_tier_hint] ?? "#2563eb";
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
    <div
      style={{
        background: "#0c0c10",
        border: "2px solid #7c3aed",
        borderRadius: 18,
        padding: "1.85rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
      className="animate-fadeSlideUp"
    >
      {/* ── TOP HEADER & PREDICTION ────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="section-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>
                Predicted Pattern
              </span>
              <span
                style={{
                  background: "#000000",
                  border: `1px solid ${tierColor}`,
                  color: tierColor,
                  borderRadius: 6,
                  padding: "1px 7px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                {tierLabel}
              </span>
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em", margin: 0, color: "#ffffff" }}>
              {result.top_pattern}
            </h2>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 900,
                color: confPct >= 60 ? "#a78bfa" : "#f59e0b",
                lineHeight: 1,
              }}
            >
              {confPct}%
            </div>
            <div style={{ fontSize: "0.72rem", color: "#a1a1aa", marginTop: 2, fontWeight: 600 }}>confidence</div>
          </div>
        </div>

        <ConfBar value={result.confidence} />
      </div>

      {/* ── ARCHITECTURE REASONING & RATIONALE ─────────────────────────────── */}
      <div style={{ background: "#000000", border: "1px solid #27272a", borderLeft: "4px solid #7c3aed", borderRadius: 10, padding: "1rem 1.15rem" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#c4b5fd", marginBottom: 6 }}>
          Model Architecture Reasoning
        </p>
        <p
          style={{ fontSize: "0.88rem", color: "#d4d4d8", lineHeight: 1.65, margin: 0 }}
          dangerouslySetInnerHTML={{
            __html: result.architecture_reasoning.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#ffffff'>$1</strong>"),
          }}
        />
      </div>

      {/* ── PROGRESSIVE DISCLOSURE TOGGLES (CHOICE-DRIVEN) ──────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Structural Decomposition
          </span>
          <span style={{ fontSize: "0.72rem", color: "#71717a" }}>
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
              padding: "0.7rem 1rem",
              borderRadius: 8,
              border: showTechnical ? "2px solid #7c3aed" : "1px solid #27272a",
              background: showTechnical ? "#1e1136" : "#000000",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Wrench size={16} color="#c4b5fd" />
              <span style={{ fontSize: "0.84rem" }}>
                What it Actually Has <span style={{ opacity: 0.7, fontWeight: 500 }}>({result.technical_structure.length} tiers)</span>
              </span>
            </div>
            <ChevronDown size={15} style={{ transform: showTechnical ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {/* Toggle: Business Sub-domains ("What it contains") */}
          <button
            type="button"
            onClick={() => setShowSubdomains(!showSubdomains)}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "0.7rem 1rem",
              borderRadius: 8,
              border: showSubdomains ? "2px solid #2563eb" : "1px solid #27272a",
              background: showSubdomains ? "#070e1c" : "#000000",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={16} color="#60a5fa" />
              <span style={{ fontSize: "0.84rem" }}>
                What it Contains <span style={{ opacity: 0.7, fontWeight: 500 }}>({result.functional_subdomains.length} domains)</span>
              </span>
            </div>
            <ChevronDown size={15} style={{ transform: showSubdomains ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
        </div>

        {/* Revealed: Technical Components */}
        {showTechnical && (
          <div className="animate-fadeIn" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {result.technical_structure.map((comp) => (
              <div
                key={comp.category}
                style={{
                  background: "#000000",
                  border: "1px solid #27272a",
                  borderLeft: "3px solid #7c3aed",
                  borderRadius: 8,
                  padding: "0.75rem 0.9rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c4b5fd" }}>{comp.label}</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {comp.items.map((item) => (
                      <span
                        key={item}
                        style={{
                          fontSize: "0.72rem",
                          background: "#18181b",
                          border: "1px solid #27272a",
                          color: "#f4f4f5",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#a1a1aa", margin: 0 }}>{comp.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Revealed: Functional Subdomains */}
        {showSubdomains && (
          <div className="animate-fadeIn" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {result.functional_subdomains.map((sub) => (
              <div
                key={sub.name}
                style={{
                  background: "#000000",
                  border: "1px solid #27272a",
                  borderLeft: "3px solid #2563eb",
                  borderRadius: 8,
                  padding: "0.75rem 0.9rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#93c5fd" }}>{sub.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: 700 }}>
                    {Math.round(sub.confidence * 100)}% match
                  </span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#a1a1aa", margin: "0 0 4px" }}>{sub.description}</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {sub.evidence.map((ev, i) => (
                    <span key={i} style={{ fontSize: "0.7rem", color: "#f4f4f5", background: "#18181b", padding: "1px 5px", borderRadius: 3, border: "1px solid #27272a" }}>
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
      <div style={{ background: "#000000", border: "1px solid #27272a", borderRadius: 12, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
          <div>
            <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#fff" }}>
              Visual Statistical Representation
            </span>
            <p style={{ fontSize: "0.75rem", color: "#a1a1aa", margin: "2px 0 0" }}>
              Model analysis metrics & comparison against verified reference benchmark
            </p>
          </div>
          <span style={{ fontSize: "0.75rem", background: "#061510", border: "1px solid #10b981", color: "#10b981", padding: "3px 9px", borderRadius: 6, fontWeight: 700 }}>
            Health Rating: {stats.maintainability_rating}
          </span>
        </div>

        {/* Metric Gauges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
          {/* Pattern Adherence */}
          <div style={{ background: "#0d0d11", border: "1px solid #27272a", borderLeft: "3px solid #7c3aed", borderRadius: 8, padding: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: "0.78rem", color: "#a1a1aa", fontWeight: 600 }}>Pattern Adherence</span>
              <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "#a78bfa" }}>
                {stats.pattern_adherence_score}%
              </span>
            </div>
            <ConfBar value={stats.pattern_adherence_score / 100} color="#7c3aed" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#71717a", marginTop: 5 }}>
              <span>Input Repo</span>
              <span>Benchmark: {bmStats.pattern_adherence_score}%</span>
            </div>
          </div>

          {/* Modularity Index */}
          <div style={{ background: "#0d0d11", border: "1px solid #27272a", borderLeft: "3px solid #2563eb", borderRadius: 8, padding: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: "0.78rem", color: "#a1a1aa", fontWeight: 600 }}>Modularity Index</span>
              <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "#60a5fa" }}>
                {stats.modularity_index}%
              </span>
            </div>
            <ConfBar value={stats.modularity_index / 100} color="#2563eb" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#71717a", marginTop: 5 }}>
              <span>Coupling: {stats.coupling_risk}</span>
              <span>Benchmark: {bmStats.modularity_index}%</span>
            </div>
          </div>
        </div>

        {/* Layer Distribution Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#a1a1aa", marginBottom: 6, fontWeight: 600 }}>
            <span>Architectural Layer Distribution</span>
            <span>Presentation / Logic / Persistence / Infra</span>
          </div>

          {/* Input Repo Distribution */}
          <div style={{ height: 10, borderRadius: 4, overflow: "hidden", display: "flex", gap: 1, marginBottom: 4, background: "#18181b" }}>
            <div style={{ width: `${stats.layer_distribution.presentation}%`, background: "#7c3aed" }} title={`Presentation: ${stats.layer_distribution.presentation}%`} />
            <div style={{ width: `${stats.layer_distribution.business_logic}%`, background: "#2563eb" }} title={`Business Logic: ${stats.layer_distribution.business_logic}%`} />
            <div style={{ width: `${stats.layer_distribution.persistence}%`, background: "#10b981" }} title={`Persistence: ${stats.layer_distribution.persistence}%`} />
            <div style={{ width: `${stats.layer_distribution.infrastructure}%`, background: "#f59e0b" }} title={`Infrastructure: ${stats.layer_distribution.infrastructure}%`} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, fontSize: "0.72rem", color: "#a1a1aa", fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed" }} /> Presentation: {stats.layer_distribution.presentation}%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb" }} /> Logic: {stats.layer_distribution.business_logic}%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} /> Persistence: {stats.layer_distribution.persistence}%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b" }} /> Infra: {stats.layer_distribution.infrastructure}%
            </span>
          </div>
        </div>

        {/* Statistical delta summary */}
        <div style={{ marginTop: 12, padding: "0.7rem 0.9rem", background: "#121218", border: "1px solid #27272a", borderRadius: 6, fontSize: "0.78rem", color: "#f4f4f5", lineHeight: 1.5 }}>
          {result.comparison.summary}
        </div>
      </div>

      {/* ── CLOSEST BENCHMARK MATCH REPOSITORY ──────────────────────────────── */}
      <div style={{ background: "#000000", border: "1px solid #27272a", borderLeft: "4px solid #10b981", borderRadius: 12, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span className="section-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>
            Closest Benchmark Match
          </span>
          <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 800 }}>
            {Math.round(result.closest_match.similarity_score * 100)}% similarity
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#fff" }}>
                {result.closest_match.full_name}
              </h3>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", background: "#18181b", border: "1px solid #27272a", padding: "1px 7px", borderRadius: 4, color: "#f59e0b", fontWeight: 700 }}>
                <Star size={11} fill="#f59e0b" />
                {result.closest_match.stars.toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#a1a1aa", margin: "4px 0 0" }}>
              Owner: <strong style={{ color: "#ffffff" }}>{result.closest_match.owner}</strong> • Pattern: <strong style={{ color: "#ffffff" }}>{result.closest_match.pattern}</strong>
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
              background: "#18181b",
              border: "1px solid #27272a",
              color: "#ffffff",
              padding: "0.5rem 1rem",
              borderRadius: 6,
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <span>View on GitHub</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ── RECOMMENDED ARCHITECTURE DIAGRAM ────────────────────────────────── */}
      {result.recommended_diagram && (
        <div style={{ background: "#000000", border: "1px solid #27272a", borderRadius: 12, padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <span className="section-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>
                Recommended Architecture Diagram
              </span>
              <p style={{ fontSize: "0.82rem", color: "#f4f4f5", margin: "2px 0 0", fontWeight: 700 }}>
                {result.recommended_diagram.caption}
              </p>
            </div>
            <span style={{ fontSize: "0.72rem", background: "#070e1c", border: "1px solid #2563eb", color: "#60a5fa", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
              {result.recommended_diagram.diagram_type.replace("_", " ")}
            </span>
          </div>

          <div
            onClick={() => setModalDiagramUrl(result.recommended_diagram?.storage_url || null)}
            style={{
              position: "relative",
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #27272a",
              background: "#000000",
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
                background: "#000000",
                border: "1px solid #27272a",
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#c4b5fd",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Maximize2 size={12} />
              <span>Expand</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CORRECTED FLOW & RECOMMENDATIONS ──────────────────────────────── */}
      <div style={{ background: "#000000", border: "1px solid #27272a", borderLeft: "4px solid #d97706", borderRadius: 12, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span className="section-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>
            Corrected Flow & Recommendations
          </span>
          <button
            type="button"
            onClick={handleCopyMermaid}
            style={{
              background: copiedCode ? "#061510" : "#18181b",
              border: `1px solid ${copiedCode ? "#10b981" : "#27272a"}`,
              color: copiedCode ? "#10b981" : "#f4f4f5",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {copiedCode ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedCode ? "Copied Diagram" : "Copy Mermaid Flow"}</span>
          </button>
        </div>

        {/* Actionable Recommendations */}
        <div style={{ marginBottom: "1rem" }}>
          {result.flow_correction.recommendations.map((rec, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: "0.85rem", color: "#f4f4f5", lineHeight: 1.5 }}>
                {rec}
              </span>
            </div>
          ))}
        </div>

        {/* Mermaid Sequence Code / Viewer */}
        <div style={{ borderTop: "1px solid #27272a", paddingTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: "0.75rem", color: "#a1a1aa", fontWeight: 600 }}>
              Recommended Sequence Flow (Mermaid)
            </span>
            <button
              type="button"
              onClick={() => setShowMermaidRaw(!showMermaidRaw)}
              style={{
                background: "transparent",
                border: "none",
                color: "#c4b5fd",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Code2 size={13} />
              <span>{showMermaidRaw ? "Hide Syntax" : "Show Syntax"}</span>
            </button>
          </div>

          {showMermaidRaw && (
            <pre
              style={{
                background: "#08080a",
                border: "1px solid #27272a",
                borderRadius: 8,
                padding: "0.75rem",
                fontSize: "0.75rem",
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
      <div style={{ fontSize: "0.72rem", color: "#71717a", borderTop: "1px solid #27272a", paddingTop: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
        <Info size={13} />
        <span>{result.model_info}</span>
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
            background: "rgba(0,0,0,0.92)",
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
              borderRadius: 8,
              border: "2px solid #7c3aed",
              background: "#000000",
            }}
          />
        </div>
      )}
    </div>
  );
}
