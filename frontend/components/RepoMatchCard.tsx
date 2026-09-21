"use client";

import { useEffect, useState } from "react";
import { Star, ExternalLink, Zap, Layers, Sparkles } from "lucide-react";

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
  onDeepAnalyze?: () => void;
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

interface PctTheme {
  primary: string;
  secondary: string;
  text: string;
  bg: string;
  border: string;
  glow: string;
  subtleBg: string;
  label: string;
}

function getPercentageTheme(pct: number): PctTheme {
  if (pct >= 85) {
    return {
      primary: "#10b981", // Vibrant Emerald
      secondary: "#34d399",
      text: "#6ee7b7",
      bg: "#05271c",
      border: "#059669",
      glow: "rgba(16, 185, 129, 0.35)",
      subtleBg: "rgba(16, 185, 129, 0.12)",
      label: "Excellent Match",
    };
  }
  if (pct >= 75) {
    return {
      primary: "#8b5cf6", // Radiant Violet
      secondary: "#c084fc",
      text: "#ddd6fe",
      bg: "#1c0e35",
      border: "#7c3aed",
      glow: "rgba(139, 92, 246, 0.35)",
      subtleBg: "rgba(139, 92, 246, 0.12)",
      label: "Strong Match",
    };
  }
  if (pct >= 65) {
    return {
      primary: "#0ea5e9", // Electric Sky / Cyan
      secondary: "#38bdf8",
      text: "#bae6fd",
      bg: "#062233",
      border: "#0284c7",
      glow: "rgba(14, 165, 233, 0.35)",
      subtleBg: "rgba(14, 165, 233, 0.12)",
      label: "Good Match",
    };
  }
  if (pct >= 50) {
    return {
      primary: "#f59e0b", // Warm Amber
      secondary: "#fbbf24",
      text: "#fde68a",
      bg: "#261905",
      border: "#d97706",
      glow: "rgba(245, 158, 11, 0.35)",
      subtleBg: "rgba(245, 158, 11, 0.12)",
      label: "Moderate Match",
    };
  }
  return {
    primary: "#f43f5e", // Coral Rose
    secondary: "#fb7185",
    text: "#fecdd3",
    bg: "#27060e",
    border: "#e11d48",
    glow: "rgba(244, 63, 94, 0.35)",
    subtleBg: "rgba(244, 63, 94, 0.12)",
    label: "Partial Match",
  };
}

function AnimatedBar({
  value,
  primaryColor,
  secondaryColor,
  delay = 0,
}: {
  value: number;
  primaryColor: string;
  secondaryColor: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay + 100);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div
      style={{
        background: "#18181b",
        borderRadius: 999,
        height: 6,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          borderRadius: 999,
          boxShadow: `0 0 10px ${primaryColor}88`,
          transition: "width 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
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
  onDeepAnalyze,
}: RepoMatchCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const theme = getPercentageTheme(match_pct);
  const tierColor = TIER_COLORS[source_tier] ?? "#2563eb";
  const tierLabel = TIER_LABELS[source_tier] ?? source_tier;

  const [owner, repoShort] = repo_name.includes("/")
    ? repo_name.split("/")
    : ["", repo_name];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `linear-gradient(180deg, ${theme.subtleBg} 0%, #0c0c10 28%, #0c0c10 100%)`,
        border: `1px solid ${isHovered ? theme.primary : "#27272a"}`,
        borderTop: `3px solid ${theme.primary}`,
        borderRadius: 12,
        padding: "1.25rem",
        animationDelay: `${animDelay}ms`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        boxSizing: "border-box",
        transform: isHovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: isHovered
          ? `0 12px 28px -6px ${theme.glow}`
          : `0 4px 14px -6px ${theme.glow}`,
        transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className="animate-fadeSlideUp"
    >
      {/* ── CARD HEADER: REPO TITLE + RANK BADGE ── */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: "0.75rem",
          }}
        >
          {/* Repo Name */}
          <a
            href={github_url}
            target="_blank"
            rel="noopener noreferrer"
            title={`View ${repo_name} on GitHub`}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
              flex: 1,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={theme.secondary} style={{ flexShrink: 0 }}>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {owner && (
                <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
                  {owner}/
                </span>
              )}
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                {repoShort}
              </span>
            </div>
            <ExternalLink size={12} color="#71717a" style={{ flexShrink: 0 }} />
          </a>

          {/* Rank Badge */}
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              fontSize: "0.72rem",
              fontWeight: 800,
              color: theme.text,
              flexShrink: 0,
            }}
          >
            #{rank}
          </span>
        </div>

        {/* ── META STRIP: STARS, LANGUAGE, TIER & MATCH SCORE ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          {/* Tech tags */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#f59e0b",
                background: "#181303",
                border: "1px solid #784807",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              <Star size={11} fill="#f59e0b" color="#f59e0b" />
              {formatStars(stars)}
            </span>

            {language && (
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#93c5fd",
                  background: "#081326",
                  border: "1px solid #1e40af",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontWeight: 700,
                }}
              >
                {language}
              </span>
            )}

            <span
              style={{
                fontSize: "0.72rem",
                color: tierColor,
                background: "#000000",
                border: `1px solid ${tierColor}`,
                borderRadius: 4,
                padding: "2px 6px",
                fontWeight: 700,
              }}
            >
              {tierLabel}
            </span>
          </div>

          {/* Match Score Display */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: theme.text,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 4,
                padding: "2px 6px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {theme.label}
            </span>
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 900,
                color: theme.primary,
                lineHeight: 1,
              }}
            >
              {match_pct}%
            </span>
          </div>
        </div>

        {/* Dynamic Color Match Bar */}
        <div style={{ marginBottom: "0.85rem" }}>
          <AnimatedBar
            value={match_pct}
            primaryColor={theme.primary}
            secondaryColor={theme.secondary}
            delay={animDelay}
          />
        </div>

        {/* ── ARCHITECTURE PATTERN BADGE ── */}
        {architecture_pattern && (
          <div style={{ marginBottom: "0.65rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.75rem",
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                borderRadius: 6,
                padding: "3px 8px",
                fontWeight: 700,
              }}
            >
              <Layers size={12} color={theme.secondary} />
              <span>{architecture_pattern}</span>
            </span>
          </div>
        )}

        {/* ── DETECTED SIGNALS TAGS ── */}
        {detected_signals && detected_signals.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.75rem" }}>
            {detected_signals.map((sig) => (
              <span
                key={sig}
                style={{
                  fontSize: "0.7rem",
                  color: "#d4d4d8",
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontWeight: 600,
                }}
              >
                {sig}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── RATIONALE SNIPPET (FLEXIBLE MIDDLE BODY) ── */}
      {rationale && (
        <div
          style={{
            fontSize: "0.78rem",
            color: "#a1a1aa",
            lineHeight: 1.5,
            margin: "0.6rem 0 1rem",
            padding: "0.7rem 0.85rem",
            background: "#060608",
            border: "1px solid #1c1c22",
            borderRadius: 8,
            flex: 1,
            overflowWrap: "anywhere",
          }}
          dangerouslySetInnerHTML={{
            __html: rationale.replace(
              /\*\*(.*?)\*\*/g,
              `<strong style="color: ${theme.secondary}">$1</strong>`
            ),
          }}
        />
      )}

      {/* ── CARD FOOTER ACTIONS ── */}
      <div
        style={{
          paddingTop: "0.75rem",
          borderTop: "1px solid #1f1f23",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: "auto",
        }}
      >
        {onDeepAnalyze && (
          <button
            type="button"
            onClick={onDeepAnalyze}
            style={{
              flex: 1,
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              fontSize: "0.8125rem",
              fontWeight: 700,
              padding: "7px 12px",
              borderRadius: 6,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.primary;
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.bg;
              e.currentTarget.style.color = theme.text;
            }}
          >
            <Zap size={13} />
            <span>Deep Analyze in Studio</span>
          </button>
        )}

        <a
          href={github_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open repository on GitHub"
          style={{
            background: "#121217",
            border: "1px solid #27272a",
            color: "#a1a1aa",
            padding: "7px 10px",
            borderRadius: 6,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.primary;
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#27272a";
            e.currentTarget.style.color = "#a1a1aa";
          }}
        >
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
