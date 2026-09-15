"use client";

import { useState, useRef } from "react";

const EXAMPLE_PROMPTS = [
  "A REST API for task management with JWT authentication and PostgreSQL",
  "A microservices e-commerce app with separate user, product, and order services",
  "A CLI tool that parses and validates YAML config files",
  "A real-time chat app using WebSockets and Go",
  "A GraphQL API for a blog with comments and authentication",
  "A Flutter mobile app with clean architecture and local database",
];

interface IdeaFormProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
}

export default function IdeaForm({ onSubmit, isLoading }: IdeaFormProps) {
  const [idea, setIdea] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLen = 1000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length >= 10 && !isLoading) {
      onSubmit(idea.trim());
    }
  };

  const handleExample = (prompt: string) => {
    setIdea(prompt);
    textareaRef.current?.focus();
  };

  const remaining = maxLen - idea.length;
  const isReady = idea.trim().length >= 10 && !isLoading;

  return (
    <form onSubmit={handleSubmit}>
      {/* Textarea */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <textarea
          ref={textareaRef}
          value={idea}
          onChange={(e) => setIdea(e.target.value.slice(0, maxLen))}
          placeholder="Describe your project idea… e.g. 'I want to build a REST API for task management with JWT auth, PostgreSQL, and TypeScript'"
          rows={6}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(124,58,237,0.25)",
            color: "var(--foreground)",
            borderRadius: 12,
            padding: "1rem 1.1rem",
            fontSize: "0.95rem",
            outline: "none",
            resize: "vertical",
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.65,
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(124,58,237,0.7)";
            e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(124,58,237,0.25)";
            e.target.style.boxShadow = "none";
          }}
          disabled={isLoading}
        />
        {/* Character counter */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 12,
            fontSize: "0.72rem",
            color: remaining < 100 ? "#f59e0b" : "var(--muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {remaining} left
        </div>
      </div>

      {/* Example prompts */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.6rem",
          }}
        >
          Try an example
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleExample(p)}
              disabled={isLoading}
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#c4b5fd",
                borderRadius: 8,
                padding: "4px 11px",
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: "all 0.18s",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.18)";
                (e.target as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.08)";
                (e.target as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.2)";
              }}
            >
              {p.length > 48 ? p.slice(0, 48) + "…" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isReady}
        className="btn-primary"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: "1rem",
          padding: "0.8rem 1.6rem",
        }}
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            Analyzing your idea…
          </>
        ) : (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            Find Similar Repos
          </>
        )}
      </button>

      {idea.trim().length > 0 && idea.trim().length < 10 && (
        <p style={{ fontSize: "0.78rem", color: "#f87171", marginTop: "0.5rem", textAlign: "center" }}>
          Please describe your idea in at least 10 characters.
        </p>
      )}
    </form>
  );
}
