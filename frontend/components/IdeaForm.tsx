"use client";

import { useState, useRef } from "react";
import TagInput from "./TagInput";
import {
  FileText,
  MessageSquare,
  Search,
  Loader2,
  Lightbulb,
  Plus,
  Compass,
} from "lucide-react";

const DOMAIN_CATEGORIES = [
  "Web Application & SaaS",
  "Distributed Backend & Microservices",
  "AI & Machine Learning Systems",
  "Developer Tools & CLI",
  "Realtime & IoT / WebSockets",
  "FinTech & Transaction Processing",
  "Mobile Backend (Flutter / React Native)",
];

const ARCH_PATTERNS = [
  "Clean Architecture",
  "Microservices Architecture",
  "Hexagonal Architecture / Ports & Adapters",
  "CQRS & Event-Driven",
  "Modular Monolith",
  "Serverless Architecture",
  "Layered Backend Architecture",
];

const LANGUAGES = ["TypeScript", "Python", "Go", "Java", "C#", "Rust", "JavaScript"];
const COMMON_FRAMEWORKS = ["NestJS", "FastAPI", "Express", "Gin", "Spring Boot", "Axum", "Django", "Next.js"];

const EXAMPLE_PROMPTS = [
  {
    title: "Task Management REST API",
    color: "#7c3aed",
    prompt: "A robust REST API for enterprise task management with JWT authentication, PostgreSQL repository pattern, Redis caching, and TypeScript NestJS.",
  },
  {
    title: "E-Commerce Microservices",
    color: "#2563eb",
    prompt: "A microservices e-commerce application with separate user, catalog, cart, and payment services communicating via gRPC and RabbitMQ in Go.",
  },
  {
    title: "Real-time AI Copilot Backend",
    color: "#059669",
    prompt: "An asynchronous Python FastAPI service with WebSockets for streaming LLM completions, vector database embeddings search, and Celery background workers.",
  },
  {
    title: "Hexagonal FinTech Ledger",
    color: "#d97706",
    prompt: "A high-security financial ledger in Java with Spring Boot using Hexagonal architecture to isolate double-entry bookkeeping domain from external databases and payment gateways.",
  },
];

interface IdeaFormProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export default function IdeaForm({ onSubmit, isLoading, initialQuery }: IdeaFormProps) {
  const [viewMode, setViewMode] = useState<"dialogue" | "form">("dialogue");
  const [idea, setIdea] = useState(
    initialQuery || "A distributed payment processing service in Go with gRPC, PostgreSQL repository pattern, and event-driven webhook dispatching."
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLen = 1500;

  // Structured Form state
  const [domain, setDomain] = useState("Web Application & SaaS");
  const [archStyle, setArchStyle] = useState("Clean Architecture");
  const [targetLang, setTargetLang] = useState("TypeScript");
  const [frameworks, setFrameworks] = useState<string[]>(["NestJS"]);
  const [features, setFeatures] = useState<string[]>(["JWT Auth", "PostgreSQL", "Caching"]);
  const [scale, setScale] = useState("Standard Production API");

  const handleDialogueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length >= 5 && !isLoading) {
      onSubmit(idea.trim());
    }
  };

  const handleStructuredSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const parts = [
      `A ${domain} built with ${targetLang}`,
      frameworks.length > 0 ? `utilizing ${frameworks.join(", ")}` : "",
      `following ${archStyle} design principles`,
      `designed for ${scale}`,
      features.length > 0 ? `incorporating features: ${features.join(", ")}` : "",
    ].filter(Boolean);

    const synthesizedPrompt = parts.join(", ") + ".";
    setIdea(synthesizedPrompt);
    onSubmit(synthesizedPrompt);
  };

  const handleExample = (prompt: string) => {
    setIdea(prompt);
    textareaRef.current?.focus();
  };

  const insertConcept = (concept: string) => {
    setIdea((prev) => `${prev.trim()} ${concept}`);
  };

  const remaining = maxLen - idea.length;
  const isDialogueReady = idea.trim().length >= 5 && !isLoading;

  return (
    <div
      style={{
        background: "#0c0c10",
        border: "2px solid #2563eb",
        borderRadius: 16,
        padding: "1.5rem",
      }}
    >
      {/* Top Header & Toggle Switch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #27272a",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Compass size={16} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
              Idea Explorer Controls
            </h2>
            <p style={{ fontSize: "0.75rem", color: "#a1a1aa", margin: 0 }}>
              Search open-source paradigms and architectures
            </p>
          </div>
        </div>

        {/* Toggle Mode Switch */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#000000",
            border: "1px solid #27272a",
            padding: "3px",
            borderRadius: 8,
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("dialogue")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 700,
              color: viewMode === "dialogue" ? "#ffffff" : "#a1a1aa",
              background: viewMode === "dialogue" ? "#2563eb" : "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background 0.15s ease",
            }}
          >
            <MessageSquare size={14} />
            <span>Dialogue</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("form")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 700,
              color: viewMode === "form" ? "#ffffff" : "#a1a1aa",
              background: viewMode === "form" ? "#2563eb" : "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background 0.15s ease",
            }}
          >
            <FileText size={14} />
            <span>Form</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 1: WRITING DIALOGUE BOX                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === "dialogue" && (
        <form onSubmit={handleDialogueSubmit} className="animate-fadeIn">
          {/* Textarea Dialogue Box */}
          <div style={{ position: "relative", marginBottom: "0.85rem" }}>
            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(e) => setIdea(e.target.value.slice(0, maxLen))}
              placeholder="Describe your system idea in freeform text... e.g. 'I want to build a distributed payment processing service in Go with gRPC, PostgreSQL, and event-driven webhook dispatching'"
              rows={6}
              style={{
                width: "100%",
                background: "#000000",
                border: "1px solid #3f3f46",
                color: "#f4f4f5",
                borderRadius: 8,
                padding: "0.9rem 1rem",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.5,
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#3f3f46")}
              disabled={isLoading}
            />
            {/* Character counter */}
            <div
              style={{
                position: "absolute",
                bottom: 10,
                right: 12,
                fontSize: "0.72rem",
                fontWeight: 600,
                color: remaining < 100 ? "#f59e0b" : "#a1a1aa",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {remaining} chars left
            </div>
          </div>

          {/* Quick Concept Injectors */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {[
                { name: "Clean Architecture", color: "#7c3aed" },
                { name: "Microservices", color: "#2563eb" },
                { name: "CQRS", color: "#d97706" },
                { name: "GraphQL API", color: "#db2777" },
                { name: "WebSockets", color: "#059669" },
                { name: "PostgreSQL", color: "#3b82f6" },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => insertConcept(c.name)}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "#000000",
                    border: `1px solid ${c.color}`,
                    color: "#f4f4f5",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Plus size={11} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Example Prompts */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <Lightbulb size={13} color="#a1a1aa" />
              <p style={{ fontSize: "0.72rem", color: "#a1a1aa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Ideas to Match
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {EXAMPLE_PROMPTS.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleExample(ex.prompt)}
                  style={{
                    background: "#000000",
                    border: `1px solid #27272a`,
                    borderLeft: `3px solid ${ex.color}`,
                    borderRadius: 6,
                    padding: "8px 10px",
                    textAlign: "left",
                    color: "#f4f4f5",
                    cursor: "pointer",
                    fontSize: "0.76rem",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = ex.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#27272a")}
                >
                  <strong style={{ display: "block", color: "#ffffff", fontSize: "0.78rem" }}>{ex.title}</strong>
                  <span style={{ color: "#a1a1aa", fontSize: "0.7rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                    {ex.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={!isDialogueReady}
            style={{
              width: "100%",
              padding: "0.85rem 1.25rem",
              borderRadius: 8,
              background: "#2563eb",
              border: "none",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: isDialogueReady ? "pointer" : "not-allowed",
              opacity: isDialogueReady ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s ease",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Searching Curated Repositories...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Discover Matching Architectures</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 2: STRUCTURED FORM                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === "form" && (
        <form onSubmit={handleStructuredSubmit} className="animate-fadeIn">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
            {/* Domain Category */}
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                Target Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="input-dark"
                style={{ cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.82rem" }}
              >
                {DOMAIN_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} style={{ background: "#000000", color: "#f4f4f5" }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Architectural Pattern Style */}
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                Architectural Paradigm
              </label>
              <select
                value={archStyle}
                onChange={(e) => setArchStyle(e.target.value)}
                className="input-dark"
                style={{ cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.82rem" }}
              >
                {ARCH_PATTERNS.map((p) => (
                  <option key={p} value={p} style={{ background: "#000000", color: "#f4f4f5" }}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
            {/* Primary Language */}
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                Primary Language
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="input-dark"
                style={{ cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.82rem" }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l} style={{ background: "#000000", color: "#f4f4f5" }}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Scale */}
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                Scale & Workload
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                className="input-dark"
                style={{ cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.82rem" }}
              >
                <option value="Lightweight Prototype / MVP" style={{ background: "#000000", color: "#f4f4f5" }}>Lightweight MVP</option>
                <option value="Standard Production API" style={{ background: "#000000", color: "#f4f4f5" }}>Standard API</option>
                <option value="High-Throughput / Distributed Scale" style={{ background: "#000000", color: "#f4f4f5" }}>High-Throughput</option>
                <option value="Mission-Critical Enterprise" style={{ background: "#000000", color: "#f4f4f5" }}>Enterprise</option>
              </select>
            </div>
          </div>

          {/* Frameworks Tag Input */}
          <div style={{ marginBottom: "0.85rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
              Desired Frameworks
            </label>
            <TagInput
              tags={frameworks}
              onChange={setFrameworks}
              suggestions={COMMON_FRAMEWORKS}
              placeholder="e.g. NestJS, FastAPI, Gin, Spring Boot..."
            />
          </div>

          {/* Features / Capabilities Tag Input */}
          <div style={{ marginBottom: "1.1rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
              Key Features
            </label>
            <TagInput
              tags={features}
              onChange={setFeatures}
              suggestions={["JWT Auth", "PostgreSQL", "Redis Caching", "gRPC", "WebSockets", "Kafka", "Docker", "GraphQL", "OAuth2", "Elasticsearch"]}
              placeholder="e.g. JWT Auth, PostgreSQL, gRPC, WebSockets..."
            />
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.85rem 1.25rem",
              borderRadius: 8,
              background: "#2563eb",
              border: "none",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Searching Paradigms...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Search Matching Paradigms</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
