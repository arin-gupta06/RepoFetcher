"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExploreRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=explore");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4b5fd" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="animate-spin">🌀</span>
        <span>Loading Architecture Ideas Studio...</span>
      </div>
    </div>
  );
}
