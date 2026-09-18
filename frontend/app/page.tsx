"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  Zap,
  Layers,
  Cpu,
  ShieldCheck,
  Terminal,
  Activity,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  GitBranch,
} from "lucide-react";

// Archetypes for the interactive visual schematic viewer
const ARCHETYPES = [
  {
    id: "clean-arch",
    name: "Clean Architecture",
    tag: "Domain-Centric Decoupling",
    color: "#7c3aed",
    bgDark: "#130a24",
    icon: Layers,
    modularityScore: 94,
    coupling: "High Resistance (0.12)",
    testability: "100%",
    imageSrc: "/hexagonal_schematic.png",
    imageAlt: "Clean Architecture & Hexagonal Domain Schematic",
    flow: "API Drivers → Use Cases → Domain Entities (Inversion of Control)",
    layers: [
      { name: "Frameworks & Drivers", type: "FastAPI / Next.js / PostgreSQL", color: "#6d28d9", badge: "Inward Only" },
      { name: "Interface Adapters", type: "Controllers & Repositories", color: "#7c3aed", badge: "Data Transformer" },
      { name: "Application Use Cases", type: "Business Interactors", color: "#8b5cf6", badge: "Pure Orchestration" },
      { name: "Core Domain Entities", type: "Business Rules & Models", color: "#a78bfa", badge: "Zero Dependencies" },
    ],
  },
  {
    id: "microservices",
    name: "Event-Driven Microservices",
    tag: "Distributed Asynchronous",
    color: "#2563eb",
    bgDark: "#081326",
    icon: Cpu,
    modularityScore: 91,
    coupling: "Max Decoupled (0.05)",
    testability: "92%",
    imageSrc: "/architecture_hero.png",
    imageAlt: "Event-Driven Microservices 3D Topology Blueprint",
    flow: "API Gateway → Microservices ⇄ Kafka Event Mesh ⇄ Isolated DBs",
    layers: [
      { name: "API Gateway & Ingress", type: "Traefik / Envoy / Kong", color: "#1d4ed8", badge: "Ingress Router" },
      { name: "Autonomous Service Nodes", type: "Order, Auth, Billing Services", color: "#2563eb", badge: "Bounded Contexts" },
      { name: "Event Mesh / Broker", type: "Apache Kafka / RabbitMQ", color: "#3b82f6", badge: "Async Pub/Sub" },
      { name: "Private State DBs", type: "Postgres, MongoDB, Redis", color: "#60a5fa", badge: "DB-Per-Service" },
    ],
  },
  {
    id: "hexagonal",
    name: "Hexagonal / Ports",
    tag: "Pluggable Core Isolation",
    color: "#059669",
    bgDark: "#041a12",
    icon: ShieldCheck,
    modularityScore: 96,
    coupling: "High Resistance (0.08)",
    testability: "98%",
    imageSrc: "/hexagonal_schematic.png",
    imageAlt: "Hexagonal Ports and Adapters Blueprint",
    flow: "Inbound Port → Application Core → Outbound Port → Database Adapter",
    layers: [
      { name: "Driving / Inbound Adapters", type: "REST API, CLI, GraphQL", color: "#047857", badge: "Invokes Ports" },
      { name: "Inbound & Outbound Ports", type: "Interface Contracts", color: "#059669", badge: "Contract Boundary" },
      { name: "Pure Application Domain", type: "Domain Logic & Rules", color: "#10b981", badge: "No External I/O" },
      { name: "Driven / Outbound Adapters", type: "SQL Repository, Stripe", color: "#34d399", badge: "Implements Ports" },
    ],
  },
  {
    id: "cqrs",
    name: "CQRS & Event Ledger",
    tag: "Command / Query Segregation",
    color: "#d97706",
    bgDark: "#1a1004",
    icon: Terminal,
    modularityScore: 89,
    coupling: "Pipeline Isolation (0.15)",
    testability: "95%",
    imageSrc: "/architecture_hero.png",
    imageAlt: "CQRS Command and Query Separation Blueprint",
    flow: "Command Write Pipeline ➔ Event Log ➔ Projector ➔ Query Read DB",
    layers: [
      { name: "Command Bus (Write Side)", type: "CreateOrder, ChargeUser", color: "#b45309", badge: "Mutations Only" },
      { name: "Immutable Event Sourcing Log", type: "EventStoreDB, DynamoDB", color: "#d97706", badge: "Append-Only Ledger" },
      { name: "Async Event Projector", type: "Materializer Worker", color: "#f59e0b", badge: "Builds Read Views" },
      { name: "Query Cache (Read Side)", type: "Elasticsearch, Read Replicas", color: "#fbbf24", badge: "Fast Projections" },
    ],
  },
];

const METRIC_STATS = [
  { value: "66+", label: "Curated Repositories", color: "#7c3aed", icon: Database },
  { value: "396", label: "Training Pairs", color: "#2563eb", icon: GitBranch },
  { value: "52", label: "Architecture Models", color: "#059669", icon: Layers },
  { value: "9+", label: "Ecosystems", color: "#d97706", icon: Cpu },
];

export default function HomePage() {
  const [activeArchetypeId, setActiveArchetypeId] = useState("clean-arch");
  const currentArchetype = ARCHETYPES.find((a) => a.id === activeArchetypeId) || ARCHETYPES[0];

  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#ffffff", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "2rem 1.25rem 3.5rem", width: "100%", flex: 1 }}>
        {/* ── HERO SECTION WITH 3D ARCHITECTURE GRAPHIC ── */}
        <section aria-labelledby="hero-title" style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "2rem",
              alignItems: "center",
            }}
          >
            {/* Left: Headline & Single Clear Primary Action */}
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 12px",
                  borderRadius: 9999,
                  background: "#130a24",
                  border: "1px solid #7c3aed",
                  marginBottom: "1rem",
                }}
              >
                <Sparkles size={14} color="#a78bfa" />
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#ddd6fe" }}>
                  RepoLens AI • Software Architecture Intelligence
                </span>
              </div>

              <h1
                id="hero-title"
                style={{
                  fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  margin: "0 0 1rem",
                }}
              >
                Decode Any Codebase. <br />
                <span style={{ color: "#a78bfa" }}>Inspect Its Architecture</span>.
              </h1>

              <p style={{ fontSize: "0.95rem", color: "#a1a1aa", margin: "0 0 1.75rem", lineHeight: 1.6, maxWidth: 520 }}>
                Analyze directory topology, evaluate layer modularity telemetry, and discover matching open-source reference implementations.
              </p>

              {/* Single Hero CTA — No redundant duplicate buttons */}
              <Link href="/studio" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#7c3aed",
                    color: "#ffffff",
                    border: "1px solid #8b5cf6",
                    padding: "0.75rem 1.6rem",
                    borderRadius: 8,
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <Zap size={18} />
                  <span>Launch Architecture Studio</span>
                  <ArrowRight size={16} />
                </button>
              </Link>

              {/* Quick Feature Bullet Points */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "#d4d4d8" }}>
                  <CheckCircle2 size={15} color="#10b981" />
                  <span>Sub-second Neural Classification</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "#d4d4d8" }}>
                  <CheckCircle2 size={15} color="#10b981" />
                  <span>0–100 Modularity Health Index</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "#d4d4d8" }}>
                  <CheckCircle2 size={15} color="#10b981" />
                  <span>66+ Benchmark Datasets</span>
                </div>
              </div>
            </div>

            {/* Right: Visual 3D Architecture Diagram Display */}
            <div
              style={{
                position: "relative",
                background: "#0c0c10",
                border: "2px solid #7c3aed",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 14px",
                  background: "#130a24",
                  borderBottom: "1px solid #7c3aed",
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#ddd6fe" }}>
                  SYSTEM TOPOLOGY BLUEPRINT
                </span>
                <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700 }}>
                  ● Live Modularity: 96%
                </span>
              </div>

              <div style={{ position: "relative", width: "100%", height: 300, background: "#000000" }}>
                <Image
                  src="/architecture_hero.png"
                  alt="3D Holographic Software Architecture Diagram"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 14px",
                  background: "#08080c",
                  borderTop: "1px solid #27272a",
                  fontSize: "0.75rem",
                  color: "#a1a1aa",
                }}
              >
                <span>Layers: Gateway ➔ Microservices ➔ Event Bus ➔ Storage</span>
                <span style={{ color: "#c4b5fd", fontWeight: 700 }}>Telemetry Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS METRIC RIBBON ── */}
        <section
          aria-label="Dataset Statistics"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          {METRIC_STATS.map(({ value, label, color, icon: Icon }) => (
            <div
              key={label}
              style={{
                background: "#0c0c10",
                border: `1px solid ${color}`,
                borderRadius: 8,
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "#000000",
                  border: `1px solid ${color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#a1a1aa", fontWeight: 600, marginTop: 3 }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ── INTERACTIVE VISUAL SCHEMATIC EXPLORER ── */}
        <section
          aria-labelledby="explorer-heading"
          style={{
            background: "#0c0c10",
            border: `2px solid ${currentArchetype.color}`,
            borderRadius: 12,
            padding: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #27272a", paddingBottom: "0.85rem", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 id="explorer-heading" style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Interactive Architecture Schematic Explorer
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "#a1a1aa", margin: "3px 0 0" }}>
                Select an architectural archetype to inspect its structural blueprint and layer isolation rules.
              </p>
            </div>

            {/* Archetype Selector Tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ARCHETYPES.map((arch) => {
                const isSelected = arch.id === activeArchetypeId;
                return (
                  <button
                    key={arch.id}
                    onClick={() => setActiveArchetypeId(arch.id)}
                    style={{
                      background: isSelected ? arch.color : "#000000",
                      color: isSelected ? "#ffffff" : "#d4d4d8",
                      border: `1px solid ${isSelected ? arch.color : "#27272a"}`,
                      borderRadius: 6,
                      padding: "6px 13px",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "background 0.15s ease",
                    }}
                  >
                    <arch.icon size={14} color={isSelected ? "#ffffff" : arch.color} />
                    <span>{arch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Schematic Layout (Left: Technical Diagram, Right: Layer Breakdown & Telemetry) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1.5rem",
              alignItems: "stretch",
            }}
          >
            {/* Left: High-detail Technical Schematic Blueprint Graphic */}
            <div
              style={{
                position: "relative",
                background: "#000000",
                border: "1px solid #27272a",
                borderRadius: 8,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: currentArchetype.bgDark,
                  borderBottom: `1px solid ${currentArchetype.color}`,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                <span>{currentArchetype.name.toUpperCase()} BLUEPRINT</span>
                <span style={{ color: "#34d399" }}>Score: {currentArchetype.modularityScore}/100</span>
              </div>

              <div style={{ position: "relative", width: "100%", height: 280, background: "#000000" }}>
                <Image
                  src={currentArchetype.imageSrc}
                  alt={currentArchetype.imageAlt}
                  fill
                  style={{ objectFit: "contain", padding: 8 }}
                />
              </div>

              <div
                style={{
                  background: "#08080c",
                  borderTop: "1px solid #27272a",
                  padding: "8px 12px",
                  fontSize: "0.78rem",
                  color: "#d4d4d8",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Activity size={14} color={currentArchetype.color} />
                <span>{currentArchetype.flow}</span>
              </div>
            </div>

            {/* Right: Layer Hierarchy & Modularity Telemetry */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: "0.8125rem", color: "#d4d4d8", fontWeight: 700 }}>
                Layer Isolation Hierarchy
              </span>

              {currentArchetype.layers.map((layer, idx) => (
                <div
                  key={layer.name}
                  style={{
                    background: "#000000",
                    border: `1px solid ${layer.color}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: layer.color,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                      }}
                    >
                      L{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#ffffff" }}>
                        {layer.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
                        {layer.type}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "#0d0d12",
                      border: "1px solid #27272a",
                      color: "#d4d4d8",
                      padding: "2px 7px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {layer.badge}
                  </span>
                </div>
              ))}

              {/* Modularity & Coupling Telemetry Bar */}
              <div style={{ background: "#000000", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.8125rem", color: "#d4d4d8", fontWeight: 700 }}>Modularity Health Score</span>
                  <span style={{ fontSize: "0.875rem", color: "#34d399", fontWeight: 900 }}>{currentArchetype.modularityScore} / 100</span>
                </div>
                <div style={{ width: "100%", height: 6, background: "#18181b", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ width: `${currentArchetype.modularityScore}%`, height: "100%", background: "#10b981", borderRadius: 9999 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.78rem" }}>
                  <span style={{ color: "#a1a1aa" }}>Coupling: <strong style={{ color: "#60a5fa" }}>{currentArchetype.coupling}</strong></span>
                  <span style={{ color: "#a1a1aa" }}>Testability: <strong style={{ color: "#a78bfa" }}>{currentArchetype.testability}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CORE CAPABILITY HIGHLIGHTS (3 Clean Cards) ── */}
        <section aria-labelledby="capabilities-title">
          <h2 id="capabilities-title" style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 1rem", color: "#ffffff" }}>
            Core Intelligence Capabilities
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ background: "#0c0c10", border: "1px solid #7c3aed", borderRadius: 8, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Zap size={18} color="#a78bfa" />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Neural Pattern Classification
                </h3>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                Evaluates directory trees, framework combinations, and README signatures against 50+ architecture models.
              </p>
            </div>

            <div style={{ background: "#0c0c10", border: "1px solid #2563eb", borderRadius: 8, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Activity size={18} color="#60a5fa" />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Layer Boundary Telemetry
                </h3>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                Calculates coupling resistance, layer boundary separation ratios, and generates a 0-100 Modularity Health Index.
              </p>
            </div>

            <div style={{ background: "#0c0c10", border: "1px solid #059669", borderRadius: 8, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Database size={18} color="#34d399" />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Curated Open-Source Benchmarks
                </h3>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                Directly maps your system concept against 66+ production repositories with verified architectural patterns.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid #27272a",
          background: "#000000",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Layers size={14} color="#ffffff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#ffffff" }}>
              RepoLens AI
            </span>
            <span style={{ fontSize: "0.78rem", color: "#71717a" }}>
              — Reverse Engineering Software Architectures
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ color: "#a1a1aa", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 }}>
              Home
            </Link>
            <Link href="/studio" style={{ color: "#a1a1aa", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 }}>
              Studio
            </Link>
            <Link href="/dashboard" style={{ color: "#a1a1aa", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 }}>
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
