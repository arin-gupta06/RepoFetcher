"use client";

import { useEffect, useState } from "react";
import { Star, ExternalLink } from "lucide-react";

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
  tier_3_verified_oss: "#2563eb",
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
      ? "#7c3aed"
      : value >= 50
      ? "#2563eb"
      : "#52525b";

  return (
    <div
      style={{
        background: "#18181b",
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
          transition: "width 0.6s ease",
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
  const tierColor = TIER_COLORS[source_tier] ?? "#2563eb";
  const tierLabel = TIER_LABELS[source_tier] ?? source_tier;

  const matchColor =
    match_pct >= 75
      ? "#a78bfa"
      : match_pct >= 50
      ? "#60a5fa"
      : "#a1a1aa";

  const [owner, repoShort] = repo_name.includes("/")
    ? repo_name.split("/")
    : ["", repo_name];

  return (
    <div
      style={{
        background: "#0c0c10",
        border: "1px solid #27272a",
        borderLeft: `4px solid ${match_pct >= 75 ? "#7c3aed" : "#2563eb"}`,
        borderRadius: 14,
        padding: "1.4rem 1.6rem",
        animationDelay: `${animDelay}ms`,
        position: "relative",
      }}
      className="animate-fadeSlideUp"
    >
      {/* Rank badge */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 16,
          width: 28,
          height: 28,
          borderRadius: 6,
          background: rank === 1 ? "#7c3aed" : "#18181b",
          border: rank === 1 ? "none" : "1px solid #27272a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.78rem",
          fontWeight: 800,
          color: "#ffffff",
          flexShrink: 0,
        }}
      >
        #{rank}
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#a1a1aa">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{owner}/</span>
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                {repoShort}
              </span>
              <ExternalLink size={12} color="#a1a1aa" style={{ marginLeft: 2 }} />
            </div>
          </a>

          {/* Stars + language */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b" }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              {formatStars(stars)}
            </span>
            {language && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#60a5fa",
                  background: "#080e1a",
                  border: "1px solid #2563eb",
                  borderRadius: 4,
                  padding: "1px 7px",
                  fontWeight: 700,
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
              fontSize: "1.85rem",
              fontWeight: 900,
              color: matchColor,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {match_pct}%
          </div>
          <div style={{ fontSize: "0.68rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
            Match Score
          </div>
        </div>
      </div>

      {/* Match Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.9rem" }}>
        <AnimatedBar value={match_pct} delay={animDelay} />
      </div>

      {/* Pattern + Tier row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {architecture_pattern && (
          <span
            style={{
              fontSize: "0.8rem",
              background: "#1e1136",
              border: "1px solid #7c3aed",
              color: "#ddd6fe",
              borderRadius: 6,
              padding: "3px 10px",
              fontWeight: 700,
            }}
          >
            {architecture_pattern}
          </span>
        )}
        <span
          style={{
            fontSize: "0.75rem",
            color: tierColor,
            background: "#000000",
            border: `1px solid ${tierColor}`,
            borderRadius: 6,
            padding: "2px 8px",
            fontWeight: 700,
          }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Detected signals */}
      {detected_signals && detected_signals.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.75rem" }}>
          {detected_signals.map((sig) => (
            <span
              key={sig}
              style={{
                fontSize: "0.72rem",
                color: "#f4f4f5",
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 4,
                padding: "2px 7px",
                fontWeight: 600,
              }}
            >
              {sig}
            </span>
          ))}
        </div>
      )}

      {/* Rationale */}
      {rationale && (
        <p
          style={{
            fontSize: "0.84rem",
            color: "#d4d4d8",
            lineHeight: 1.55,
            margin: 0,
            borderTop: "1px solid #27272a",
            paddingTop: "0.75rem",
          }}
        >
          {rationale}
        </p>
      )}
    </div>
  );
}
