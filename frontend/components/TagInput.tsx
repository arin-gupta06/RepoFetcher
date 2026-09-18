"use client";

import { useState, KeyboardEvent, useId } from "react";

export interface TagInputProps {
  label?: string;
  placeholder: string;
  values?: string[];
  tags?: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
}

export default function TagInput({
  label,
  placeholder,
  values,
  tags,
  onChange,
  suggestions = [],
}: TagInputProps) {
  const currentValues = values ?? tags ?? [];
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputId = useId();

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !currentValues.includes(s)
  );

  const add = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !currentValues.includes(trimmed)) {
      onChange([...currentValues, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const remove = (val: string) => onChange(currentValues.filter((v) => v !== val));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && currentValues.length) {
      remove(currentValues[currentValues.length - 1]);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {label && (
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>
          {label}
        </label>
      )}
      {/* Fix Issue 11: Standardized minHeight to 40px matching input heights */}
      <div
        style={{
          background: "#000000",
          border: "1px solid #3f3f46",
          borderRadius: 8,
          padding: "4px 8px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          minHeight: 40,
          cursor: "text",
          boxSizing: "border-box",
        }}
        onClick={() => (document.getElementById(inputId) as HTMLInputElement)?.focus()}
      >
        {currentValues.map((v) => (
          <span
            key={v}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "#130a24",
              border: "1px solid #7c3aed",
              color: "#ddd6fe",
              fontSize: "0.78rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(v);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#c4b5fd",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={currentValues.length === 0 ? placeholder : ""}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "#ffffff",
            fontSize: "0.85rem",
            flex: 1,
            minWidth: 120,
            padding: "2px 4px",
            height: 28,
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
            background: "#0c0c10",
            border: "1px solid #7c3aed",
            borderRadius: 8,
            zIndex: 100,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
          }}
        >
          {filtered.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => add(s)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                padding: "0.5rem 1rem",
                color: "#e4e4e7",
                fontSize: "0.8125rem",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#1e1136")
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

      {/* Fix Issue 2: Increased font size to >= 12px (0.8125rem = 13px) */}
      <p style={{ fontSize: "0.8125rem", color: "#a1a1aa", marginTop: 5, marginBottom: 0 }}>
        Press Enter or comma to add
      </p>
    </div>
  );
}
