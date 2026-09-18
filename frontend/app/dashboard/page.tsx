"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ArchitectureChart from "@/components/ArchitectureChart";
import {
  Database,
  GitBranch,
  TrendingUp,
  Shuffle,
  Scale,
  AlertTriangle,
  PauseCircle,
  RefreshCw,
  Zap,
  BarChart3,
  Search,
  ArrowRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

const FEATURED_ARCHITECTURES = [
  {
    name: "Clean Architecture (TypeScript / NestJS)",
    category: "Enterprise Domain-Driven",
    borderColor: "#7c3aed",
    description: "Concentric rings with domain entities at core, isolated use cases, and interchangeable database / controller adapters.",
    idealFor: "Long-term maintainability, test-driven development, high domain complexity",
    languages: ["TypeScript", "Java", "C#", "Go"],
  },
  {
    name: "Microservices Architecture (Go / Gin)",
    category: "Distributed Scalable Services",
    borderColor: "#2563eb",
    description: "Independently deployable bounded contexts communicating via gRPC or asynchronous event streams (Kafka/RabbitMQ).",
    idealFor: "Multi-team organizations, independent deployment cycles, elastic scale",
    languages: ["Go", "Python", "Rust", "Node.js"],
  },
  {
    name: "Hexagonal (Ports & Adapters)",
    category: "Decoupled Core",
    borderColor: "#059669",
    description: "Core application logic communicates through explicit input ports and output ports with pluggable persistence adapters.",
    idealFor: "Polyglot storage, high testing velocity, cloud-agnostic applications",
    languages: ["Java", "Python", "TypeScript", "Kotlin"],
  },
  {
    name: "CQRS & Event-Driven",
    category: "High-Throughput Asynchronous",
    borderColor: "#d97706",
    description: "Strict separation of write commands and read queries, typically backed by an event store and materialized views.",
    idealFor: "Audit compliance, financial ledgers, collaborative realtime apps",
    languages: ["C#", "TypeScript", "Go", "Java"],
  },
  {
    name: "Serverless Event Architecture",
    category: "Cloud Native FaaS",
    borderColor: "#0284c7",
    description: "Stateless ephemeral handlers triggered by HTTP gateways, message queues, and cloud object storage events.",
    idealFor: "Spiky workloads, cost-optimized scale-to-zero, low maintenance",
    languages: ["TypeScript", "Python", "Go"],
  },
  {
    name: "CLI & Developer Tools",
    category: "Command-Line Binary",
    borderColor: "#dc2626",
    description: "Modular pipeline with argument parsers, abstract syntax trees / linters, output formatters, and terminal UI renderers.",
    idealFor: "DevOps automation, code analysis, schema validation",
    languages: ["Rust", "Go", "TypeScript", "Python"],
  },
];

interface SymmetryTelemetry {
  symmetry_score: number;
  language_entropy: number;
  language_gini_simpson: number;
  architecture_entropy: number;
  architecture_gini_simpson: number;
  starved_categories: {
    languages: Array<{ name: string; count: number; percentage: number; deficit: number }>;
    architectures: Array<{ name: string; count: number; percentage: number; deficit: number }>;
  };
  saturated_categories: {
    languages: Array<{ name: string; count: number; percentage: number; deficit: number }>;
    architectures: Array<{ name: string; count: number; percentage: number; deficit: number }>;
  };
}

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
  symmetry_telemetry?: SymmetryTelemetry;
}

const STAT_CARDS = (stats: DatasetStats) => [
  { label: "Total Repositories", value: stats.totalHarvestedRepos, icon: Database, color: "#7c3aed" },
  { label: "Instruction Pairs", value: stats.totalInstructionPairs, icon: GitBranch, color: "#2563eb" },
  { label: "Train / Val / Test", value: `${stats.splits.trainCount} / ${stats.splits.valCount} / ${stats.splits.testCount}`, icon: TrendingUp, color: "#0ea5e9" },
  { label: "Variants per Sample", value: stats.variantsPerSample, icon: Shuffle, color: "#10b981" },
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
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStats = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const tierData = Object.fromEntries(
    Object.entries(stats.tierDistribution).map(([k, v]) => [TIER_LABELS[k] ?? k, v])
  );

  const filteredArchitectures = FEATURED_ARCHITECTURES.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.languages.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000000" }}>
      <Navbar />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
            gap: 16,
          }}
          className="animate-fadeSlideUp"
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#121218",
                border: "1px solid #7c3aed",
                borderRadius: 8,
                padding: "4px 14px",
                fontSize: "0.8rem",
                color: "#ddd6fe",
                fontWeight: 700,
                marginBottom: "0.75rem",
              }}
            >
              <BarChart3 size={15} color="#c4b5fd" />
              <span>RepoFetcher Dataset Analytics & Symmetry Telemetry</span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: 0,
                color: "#ffffff",
              }}
            >
              Dataset <span style={{ color: "#a78bfa" }}>Intelligence Dashboard</span>
            </h1>
            <p style={{ color: "#a1a1aa", fontSize: "0.92rem", margin: "6px 0 0" }}>
              Exploratory metrics, entropy distribution, and architectural catalogs from the RepoLens AI corpus.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={fetchStats}
              disabled={loading}
              style={{
                background: "#0d0d11",
                border: "1px solid #27272a",
                color: "#c4b5fd",
                fontSize: "0.85rem",
                fontWeight: 700,
                padding: "9px 18px",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>{loading ? "Syncing..." : "Refresh Telemetry"}</span>
            </button>

            <Link
              href="/"
              style={{
                textDecoration: "none",
                background: "#7c3aed",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 800,
                padding: "9px 18px",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Zap size={15} />
              <span>Open Studio</span>
            </Link>
          </div>
        </div>

        {isStatic && (
          <div
            style={{
              padding: "0.85rem 1.25rem",
              background: "#1c1504",
              border: "1px solid #f59e0b",
              borderRadius: 8,
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#fbbf24",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={18} />
            <span>Displaying cached baseline metrics. Start FastAPI server for live real-time sync.</span>
          </div>
        )}

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
              ))
            : STAT_CARDS(stats).map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  style={{
                    background: "#0c0c10",
                    border: `1px solid #27272a`,
                    borderLeft: `5px solid ${color}`,
                    borderRadius: 12,
                    padding: "1.5rem",
                  }}
                  className="animate-fadeSlideUp"
                >
                  <div style={{ marginBottom: 8 }}>
                    <Icon size={24} color={color} strokeWidth={2} />
                  </div>
                  <div
                    style={{
                      fontSize: "1.85rem",
                      fontWeight: 900,
                      color: color,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#f4f4f5", marginTop: 6, fontWeight: 700 }}>
                    {label}
                  </div>
                </div>
              ))}
        </div>

        {/* Dataset Symmetry & Adaptive Balancing Panel */}
        <div
          style={{
            background: "#0c0c10",
            border: "2px solid #7c3aed",
            borderRadius: 16,
            padding: "1.75rem",
            marginBottom: "2rem",
          }}
          className="animate-fadeSlideUp"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <Scale size={20} color="#c4b5fd" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Dataset Symmetry & Adaptive Balancing
                </h2>
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: "#1e1136",
                    color: "#ddd6fe",
                    border: "1px solid #7c3aed",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontWeight: 700,
                  }}
                >
                  Closed-Loop Autonomous
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#a1a1aa", margin: 0 }}>
                Continuous distribution monitoring via Normalized Shannon Entropy & Gini-Simpson Index.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Symmetry Index
                </div>
                <div
                  style={{
                    fontSize: "1.85rem",
                    fontWeight: 900,
                    color: (stats.symmetry_telemetry?.symmetry_score ?? 14.8) < 40 ? "#ef4444" : "#10b981",
                  }}
                >
                  {stats.symmetry_telemetry?.symmetry_score ?? 14.8}%
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {/* Starved Categories */}
            <div
              style={{
                background: "#180608",
                border: "2px solid #ef4444",
                borderRadius: 12,
                padding: "1.1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={15} color="#f87171" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f87171" }}>
                    Starved Domains (Prioritized Harvest)
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", background: "#ef4444", color: "#ffffff", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>
                  4x Quota
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {(stats.symmetry_telemetry?.starved_categories?.languages ?? [
                  { name: "Rust", count: 9 },
                  { name: "Python", count: 27 },
                  { name: "Kotlin", count: 74 },
                  { name: "Go", count: 113 },
                ]).map((item: any) => (
                  <span
                    key={item.name}
                    style={{
                      fontSize: "0.76rem",
                      background: "#000000",
                      border: "1px solid #ef4444",
                      color: "#fca5a5",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {item.name} ({item.count})
                  </span>
                ))}
                {(stats.symmetry_telemetry?.starved_categories?.architectures ?? [
                  { name: "CQRS", count: 2 },
                  { name: "Event-Driven", count: 6 },
                  { name: "FastAPI Async", count: 10 },
                  { name: "Microservices & DDD", count: 1 },
                ]).slice(0, 4).map((item: any) => (
                  <span
                    key={item.name}
                    style={{
                      fontSize: "0.76rem",
                      background: "#000000",
                      border: "1px solid #f59e0b",
                      color: "#fcd34d",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {item.name} ({item.count})
                  </span>
                ))}
              </div>
            </div>

            {/* Saturated Categories */}
            <div
              style={{
                background: "#070e1c",
                border: "2px solid #2563eb",
                borderRadius: 12,
                padding: "1.1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <PauseCircle size={15} color="#60a5fa" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#60a5fa" }}>
                    Saturated Categories (Throttled)
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", background: "#2563eb", color: "#ffffff", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>
                  Quota Paused
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {(stats.symmetry_telemetry?.saturated_categories?.languages ?? [
                  { name: "JavaScript", percentage: 67.5 },
                  { name: "TypeScript", percentage: 16.7 },
                ]).map((item: any) => (
                  <span
                    key={item.name}
                    style={{
                      fontSize: "0.76rem",
                      background: "#000000",
                      border: "1px solid #2563eb",
                      color: "#bfdbfe",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {item.name} ({item.percentage ?? 67.5}%)
                  </span>
                ))}
                {(stats.symmetry_telemetry?.saturated_categories?.architectures ?? [
                  { name: "General Modular Architecture", percentage: 76.5 },
                ]).map((item: any) => (
                  <span
                    key={item.name}
                    style={{
                      fontSize: "0.76rem",
                      background: "#000000",
                      border: "1px solid #7c3aed",
                      color: "#ddd6fe",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {item.name} ({item.percentage ?? 76.5}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Architecture patterns bar chart */}
          <div style={{ background: "#0c0c10", border: "1px solid #27272a", borderRadius: 16, padding: "1.75rem", gridColumn: "1 / -1" }}>
            <ArchitectureChart
              data={stats.architecturePatternsDistribution}
              title="Architecture Pattern Distribution (Top 15 Patterns)"
              type="bar"
            />
          </div>

          {/* Language pie */}
          <div style={{ background: "#0c0c10", border: "1px solid #27272a", borderRadius: 16, padding: "1.75rem" }}>
            <ArchitectureChart
              data={stats.languageDistribution}
              title="Language Ecosystem Breakdown"
              type="pie"
            />
          </div>

          {/* Framework bar */}
          <div style={{ background: "#0c0c10", border: "1px solid #27272a", borderRadius: 16, padding: "1.75rem" }}>
            <ArchitectureChart
              data={stats.frameworksDistribution}
              title="Framework & Library Frequency"
              type="bar"
            />
          </div>
        </div>

        {/* Tier distribution */}
        <div style={{ background: "#0c0c10", border: "1px solid #27272a", borderRadius: 16, padding: "1.75rem", marginBottom: "2.5rem" }}>
          <p className="section-label" style={{ marginBottom: 16 }}>
            Dataset Quality & Source Tier Allocation
          </p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {Object.entries(tierData).map(([label, count], i) => {
              const colors = ["#7c3aed", "#10b981", "#f59e0b"];
              const total = Object.values(tierData).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={label} style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.85rem", color: "#f4f4f5", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: colors[i % colors.length] }}>
                      {count} repos ({pct}%)
                    </span>
                  </div>
                  <div className="conf-bar-track" style={{ height: 8, background: "#18181b", borderRadius: 999 }}>
                    <div
                      className="conf-bar-fill"
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: colors[i % colors.length],
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Interactive Architecture Pattern Catalog ── */}
        <div style={{ background: "#0c0c10", border: "2px solid #7c3aed", borderRadius: 16, padding: "1.75rem", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <span className="section-label" style={{ display: "block", marginBottom: 2 }}>
                Reference Taxonomy
              </span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Curated Software Architecture Catalog
              </h3>
            </div>

            <div style={{ position: "relative", width: 300 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by paradigm, language, or domain..."
                className="input-dark"
                style={{ paddingLeft: "2.2rem" }}
              />
              <Search size={15} color="#a1a1aa" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {filteredArchitectures.map((arch, idx) => (
              <div
                key={idx}
                style={{
                  background: "#000000",
                  border: `1px solid #27272a`,
                  borderLeft: `4px solid ${arch.borderColor}`,
                  borderRadius: 12,
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <h4 style={{ fontSize: "0.98rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                      {arch.name}
                    </h4>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        background: "#000000",
                        border: `1px solid ${arch.borderColor}`,
                        color: arch.borderColor,
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {arch.category}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.84rem", color: "#a1a1aa", lineHeight: 1.5, margin: "8px 0" }}>
                    {arch.description}
                  </p>

                  <div style={{ fontSize: "0.78rem", color: "#f4f4f5", marginBottom: 12 }}>
                    <strong>Best for:</strong> <span style={{ color: "#a1a1aa" }}>{arch.idealFor}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #27272a" }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {arch.languages.map((l) => (
                      <span
                        key={l}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          background: "#18181b",
                          color: "#f4f4f5",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {l}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/?tab=analyzer`}
                    style={{
                      textDecoration: "none",
                      fontSize: "0.78rem",
                      color: "#c4b5fd",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>Analyze Pattern</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model training visual artifacts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={{ background: "#0c0c10", border: "1px solid #27272a", padding: "1.25rem", borderRadius: 16 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Exploratory Data Analysis (EDA)</p>
            <img
              src="/eda_overview.png"
              alt="RepoFetcher EDA Overview"
              style={{ width: "100%", borderRadius: 8 }}
            />
          </div>
          <div style={{ background: "#0c0c10", border: "1px solid #27272a", padding: "1.25rem", borderRadius: 16 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>BiLSTM Neural Model Training Curves</p>
            <img
              src="/lstm_training_curves.png"
              alt="BiLSTM Training History"
              style={{ width: "100%", borderRadius: 8 }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
