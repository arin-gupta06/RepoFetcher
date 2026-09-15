"use client";

import { useEffect, useState } from "react";

interface RepoMatchCardProps {
  repo_name: string;
  github_url: string;
  language: string;
  stars: number;
  architecture_pattern: string;
  detected_signals: string[];
  match_pct: number;
  rationale: string;
  source_tier: string;
  rank: number;
  animDelay?: number;
}

const TIER_COLORS: Record<string, string> = {
  tier_1_template: "#f59e0b",
  tier_2_official: "#10b981",
  tier_3_verified_oss: "#60a5fa",
};

const TIER_LABELS: Record<string, string> = {
  tier_1_template: "Template",
  tier_2_official: "Official",
  tier_3_verified_oss: "Verified OSS",
};

function AnimatedBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay + 100);
    return () => clearTimeout(t);
  }, [value, delay]);

  const color =
    value >= 75
      ? "linear-gradient(90deg, #7c3aed, #60a5fa)"
      : value >= 50
      ? "linear-gradient(90deg, #4f46e5, #818cf8)"
      : "linear-gradient(90deg, #374151, #6b7280)";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 999,
        height: 7,
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: color,
          borderRadius: 999,
          transition: "width 1s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export default function RepoMatchCard({
  repo_name,
  github_url,
  language,
  stars,
  architecture_pattern,
  detected_signals,
  match_pct,
  rationale,
  source_tier,
  rank,
  animDelay = 0,
}: RepoMatchCardProps) {
  const tierColor = TIER_COLORS[source_tier] ?? "#60a5fa";
  const tierLabel = TIER_LABELS[source_tier] ?? source_tier;

  const matchColor =
    match_pct >= 75
      ? "linear-gradient(135deg, #a78bfa, #60a5fa)"
      : match_pct >= 50
      ? "linear-gradient(135deg, #818cf8, #a78bfa)"
      : "linear-gradient(135deg, #9ca3af, #6b7280)";

  const [owner, repoShort] = repo_name.includes("/")
    ? repo_name.split("/")
    : ["", repo_name];

  return (
    <div
      className="glass-strong animate-fadeSlideUp"
      style={{
        padding: "1.4rem 1.6rem",
        animationDelay: `${animDelay}ms`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Rank badge */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 16,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: rank === 1 ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.06)",
          border: rank === 1 ? "none" : "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: rank === 1 ? "#fff" : "var(--muted)",
          flexShrink: 0,
        }}
      >
        {rank}
      </div>

      {/* Header row: repo name + match % */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "0.9rem", paddingRight: 40 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Repo name */}
          <a
            href={github_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(200,200,230,0.5)">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{owner}/</span>
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  letterSpacing: "-0.01em",
                }}
              >
                {repoShort}
              </span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 2 }}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
          </a>

          {/* Stars + language */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.78rem", color: "#f59e0b" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {formatStars(stars)}
            </span>
            {language && (
              <span
                style={{
                  fontSize: "0.73rem",
                  color: "#60a5fa",
                  background: "rgba(96,165,250,0.1)",
                  border: "1px solid rgba(96,165,250,0.2)",
                  borderRadius: 5,
                  padding: "1px 7px",
                  fontWeight: 500,
                }}
              >
                {language}
              </span>
            )}
          </div>
        </div>

        {/* Match % */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              background: matchColor,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {match_pct}%
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: 2, fontWeight: 500 }}>
            match
          </div>
        </div>
      </div>

      {/* Animated match bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.9rem" }}>
        <AnimatedBar value={match_pct} delay={animDelay} />
      </div>

      {/* Signals/tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.85rem" }}>
        {detected_signals.map((sig) => (
          <span
            key={sig}
            style={{
              fontSize: "0.72rem",
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.25)",
              color: "#c4b5fd",
              borderRadius: 6,
              padding: "2px 8px",
              fontWeight: 500,
            }}
          >
            {sig}
          </span>
        ))}
        <span
          style={{
            fontSize: "0.72rem",
            background: `${tierColor}14`,
            border: `1px solid ${tierColor}35`,
            color: tierColor,
            borderRadius: 6,
            padding: "2px 8px",
            fontWeight: 500,
          }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Rationale */}
      <p
        style={{
          fontSize: "0.82rem",
          color: "rgba(200,200,230,0.65)",
          lineHeight: 1.6,
          margin: 0,
        }}
        dangerouslySetInnerHTML={{
          __html: rationale.replace(/\*\*(.*?)\*\*/g, "<strong style='color:rgba(200,200,230,0.9)'>$1</strong>"),
        }}
      />

      {/* Open on GitHub button */}
      <a
        href={github_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "block", marginTop: "0.9rem" }}
      >
        <button
          className="btn-ghost"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Explore on GitHub
        </button>
      </a>
    </div>
  );
}
