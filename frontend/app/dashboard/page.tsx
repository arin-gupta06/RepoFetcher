"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ArchitectureChart from "@/components/ArchitectureChart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Fallback static data (shown when API is offline)
const STATIC_STATS = {
  totalHarvestedRepos: 66,
  cleanedSamplesCount: 66,
  totalInstructionPairs: 396,
  variantsPerSample: 6,
  splits: { trainCount: 316, valCount: 40, testCount: 40 },
  architecturePatternsDistribution: {
    "Clean Architecture": 5,
    "Layered Backend Architecture": 4,
    "Design Patterns Catalog": 3,
    "CQRS Pattern": 2,
    "Microservices Architecture": 2,
    "Hexagonal Architecture": 2,
    "Serverless Architecture": 2,
    "Clean Architecture / Hexagonal": 2,
    "Modular Layered Architecture": 1,
    "Modular Architecture": 1,
    "CLI Tool Architecture": 1,
    "FastAPI Async Web Service": 1,
    "General Modular Architecture": 1,
  },
  languageDistribution: {
    TypeScript: 20,
    Go: 10,
    "C#": 9,
    Python: 8,
    Java: 8,
    JavaScript: 6,
    Rust: 3,
    PHP: 1,
    Dart: 1,
  },
  frameworksDistribution: {
    Express: 22,
    Gin: 10,
    FastAPI: 8,
    "Spring Boot": 8,
    Axum: 3,
    NestJS: 2,
    "Apollo Server": 2,
  },
  tierDistribution: {
    tier_3_verified_oss: 40,
    tier_2_official: 20,
    tier_1_template: 6,
  },
  preparedAt: "2026-09-14T20:49:00.739Z",
};

interface DatasetStats {
  totalHarvestedRepos: number;
  cleanedSamplesCount: number;
  totalInstructionPairs: number;
  variantsPerSample: number;
  splits: { trainCount: number; valCount: number; testCount: number };
  architecturePatternsDistribution: Record<string, number>;
  languageDistribution: Record<string, number>;
  frameworksDistribution: Record<string, number>;
  tierDistribution: Record<string, number>;
  preparedAt: string;
}

const STAT_CARDS = (stats: DatasetStats) => [
  { label: "Total Repositories", value: stats.totalHarvestedRepos, icon: "🗂️", color: "#7c3aed" },
  { label: "Instruction Pairs", value: stats.totalInstructionPairs, icon: "🧩", color: "#4f46e5" },
  { label: "Train / Val / Test", value: `${stats.splits.trainCount} / ${stats.splits.valCount} / ${stats.splits.testCount}`, icon: "📈", color: "#0ea5e9" },
  { label: "Variants per Sample", value: stats.variantsPerSample, icon: "🔀", color: "#10b981" },
];

const TIER_LABELS: Record<string, string> = {
  tier_1_template: "Tier 1 — Templates",
  tier_2_official: "Tier 2 — Official",
  tier_3_verified_oss: "Tier 3 — Verified OSS",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DatasetStats>(STATIC_STATS as any);
  const [isStatic, setIsStatic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setIsStatic(false);
      })
      .catch(() => {
        setIsStatic(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const tierData = Object.fromEntries(
    Object.entries(stats.tierDistribution).map(([k, v]) => [TIER_LABELS[k] ?? k, v])
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }} className="animate-fadeSlideUp">
          <h1
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
            }}
          >
            <span className="gradient-text">Dataset</span> Dashboard
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Exploratory analysis of the RepoFetcher training dataset —{" "}
            <span style={{ color: "rgba(200,200,230,0.7)" }}>
              {new Date(stats.preparedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </p>
          {isStatic && (
            <div className="demo-badge" style={{ marginTop: "0.75rem", display: "inline-flex" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Showing static data — start the API server for live stats
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />
              ))
            : STAT_CARDS(stats).map(({ label, value, icon, color }) => (
                <div
                  key={label}
                  className="glass animate-fadeSlideUp"
                  style={{ padding: "1.25rem", position: "relative", overflow: "hidden" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: `${color}18`,
                      filter: "blur(12px)",
                    }}
                  />
                  <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>{icon}</div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: color,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
        </div>

        {/* Charts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {/* Architecture patterns bar chart */}
          <div className="glass-strong" style={{ padding: "1.5rem", gridColumn: "1 / -1" }}>
            <ArchitectureChart
              data={stats.architecturePatternsDistribution}
              title="Architecture Pattern Distribution (Top 15)"
              type="bar"
            />
          </div>

          {/* Language pie */}
          <div className="glass-strong" style={{ padding: "1.5rem" }}>
            <ArchitectureChart
              data={stats.languageDistribution}
              title="Language Distribution"
              type="pie"
            />
          </div>

          {/* Framework bar */}
          <div className="glass-strong" style={{ padding: "1.5rem" }}>
            <ArchitectureChart
              data={stats.frameworksDistribution}
              title="Framework Distribution"
              type="bar"
            />
          </div>
        </div>

        {/* Tier distribution */}
        <div className="glass-strong" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Source Tier Distribution</p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {Object.entries(tierData).map(([label, count], i) => {
              const colors = ["#7c3aed", "#10b981", "#f59e0b"];
              const total = Object.values(tierData).reduce((a, b) => a + b, 0);
              const pct = Math.round((count / total) * 100);
              return (
                <div key={label} style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(200,200,230,0.8)" }}>{label}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: colors[i % colors.length] }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="conf-bar-track">
                    <div
                      className="conf-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: colors[i % colors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model training images */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="glass" style={{ padding: "1.25rem" }}>
            <p className="section-label" style={{ marginBottom: 12 }}>EDA Overview</p>
            <img
              src="/eda_overview.png"
              alt="RepoFetcher EDA Overview"
              style={{ width: "100%", borderRadius: 10, opacity: 0.92 }}
            />
          </div>
          <div className="glass" style={{ padding: "1.25rem" }}>
            <p className="section-label" style={{ marginBottom: 12 }}>BiLSTM Training Curves</p>
            <img
              src="/lstm_training_curves.png"
              alt="BiLSTM Training History"
              style={{ width: "100%", borderRadius: 10, opacity: 0.92 }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
