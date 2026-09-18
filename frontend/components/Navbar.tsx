"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, LayoutDashboard, Layers, Home } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/studio", label: "Architecture Studio", icon: Zap },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats`, { method: "GET", signal: AbortSignal.timeout(3000) });
        setApiOnline(res.ok);
      } catch {
        setApiOnline(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid #27272a",
        background: "#000000",
      }}
    >
      <nav
        aria-label="Main Navigation"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 1.25rem",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Layers size={20} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "1.1rem",
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                RepoLens
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  background: "#130a24",
                  color: "#c4b5fd",
                  border: "1px solid #7c3aed",
                  padding: "1px 6px",
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                v2.0
              </span>
            </div>
            {/* Fix Issue 3: Increased font size to >= 12px (0.8125rem = 13px) */}
            <span
              style={{
                fontSize: "0.8125rem",
                color: "#a1a1aa",
                display: "block",
                lineHeight: 1.2,
                marginTop: 1,
                fontWeight: 500,
              }}
            >
              Software Architecture Intelligence
            </span>
          </div>
        </Link>

        {/* Center: Main Navigation Tabs */}
        <div
          role="navigation"
          aria-label="Primary"
          style={{
            display: "flex",
            alignItems: "center",
            background: "#0c0c10",
            border: "1px solid #27272a",
            padding: "3px",
            borderRadius: 8,
            gap: 4,
          }}
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === "/" && pathname === "/explore");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                style={{
                  textDecoration: "none",
                  padding: "0.45rem 1.1rem",
                  borderRadius: 6,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: active ? "#ffffff" : "#a1a1aa",
                  background: active ? "#7c3aed" : "transparent",
                  border: active ? "1px solid #8b5cf6" : "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "background 0.15s ease",
                }}
              >
                <Icon size={15} strokeWidth={2.5} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: Telemetry Status & GitHub Action */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Fix Issue 7: Status Indicator - No button/pill styling to avoid false affordance */}
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: apiOnline ? "#34d399" : apiOnline === false ? "#fbbf24" : "#a1a1aa",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: apiOnline ? "#10b981" : apiOnline === false ? "#f59e0b" : "#71717a",
                flexShrink: 0,
              }}
            />
            <span>{apiOnline ? "AI Engine Active" : apiOnline === false ? "Local Fallback" : "Connecting..."}</span>
          </div>

          {/* GitHub Action Button */}
          <a
            href="https://github.com/arin-gupta06/RepoFetcher"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: "0.8125rem",
                fontWeight: 600,
                padding: "0.45rem 0.9rem",
                borderRadius: 8,
                background: "#0c0c10",
                color: "#e4e4e7",
                border: "1px solid #27272a",
                cursor: "pointer",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </a>
        </div>
      </nav>
    </header>
  );
}
