"use client";

import { useState, KeyboardEvent } from "react";

interface TagInputProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
}

export default function TagInput({ label, placeholder, values, onChange, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)
  );

  const add = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const remove = (val: string) => onChange(values.filter((v) => v !== val));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && values.length) {
      remove(values[values.length - 1]);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <label className="section-label" style={{ display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          padding: "6px 8px",
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          minHeight: 42,
          cursor: "text",
        }}
        onClick={() => (document.getElementById(`tag-input-${label}`) as HTMLInputElement)?.focus()}
      >
        {values.map((v) => (
          <span key={v} className="tag" style={{ gap: 5 }}>
            {v}
            <button
              onClick={() => remove(v)}
              style={{
                background: "none",
                border: "none",
                color: "#c4b5fd",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
                fontSize: "0.95rem",
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={`tag-input-${label}`}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={values.length === 0 ? placeholder : ""}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--foreground)",
            fontSize: "0.875rem",
            flex: 1,
            minWidth: 120,
            padding: "2px 4px",
          }}
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "rgba(15,15,35,0.98)",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 10,
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {filtered.slice(0, 6).map((s) => (
            <button
              key={s}
              onMouseDown={() => add(s)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                padding: "0.5rem 1rem",
                color: "rgba(200,200,230,0.8)",
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.15)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "none")
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>
        Press Enter or comma to add
      </p>
    </div>
  );
}
