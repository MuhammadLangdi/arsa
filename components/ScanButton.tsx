"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScanButton({ hasSnapshot }: { hasSnapshot: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function runScan() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={runScan}
        disabled={loading}
        className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-purple-50 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? "Sensing your life..."
          : hasSnapshot
          ? "Run a fresh scan"
          : "Run first scan"}
      </button>

      {loading && (
        <p className="text-white/50 text-sm">
          This takes 60 to 90 seconds. Arsa is reading the last 30 days of
          your inbox and calendar, filtering noise, and building the picture.
        </p>
      )}

      {error && <p className="text-red-300 text-sm">{error}</p>}
    </div>
  );
}
