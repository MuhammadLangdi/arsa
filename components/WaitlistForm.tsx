"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [why, setWhy] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, why }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      setEmail("");
      setWhy("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-lg mx-auto text-center py-8 px-6 border border-purple-400/20 rounded-2xl bg-purple-500/5">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/10 border border-purple-400/30 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-purple-300"
          >
            <path
              d="M4 10l4 4 8-8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-white font-medium text-lg mb-2">You are in line.</p>
        <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto">
          We will reach out personally when we open your spot. Arsa is rolling
          out slowly, on purpose.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.07] transition"
          disabled={status === "loading"}
        />
      </div>

      <div>
        <textarea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="Optional. What in your life do you want Arsa to see?"
          rows={3}
          maxLength={500}
          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.07] transition resize-none"
          disabled={status === "loading"}
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading" || !email}
        className="w-full bg-white text-black px-6 py-4 rounded-2xl font-medium hover:bg-purple-50 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Saving your spot..." : "Request access"}
      </button>

      {status === "error" && (
        <p className="text-red-300 text-sm text-center">{errorMsg}</p>
      )}

      <p className="text-white/40 text-xs text-center">
        We will only email you when your spot opens. No spam. No newsletters.
      </p>
    </form>
  );
}
