"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex h-14 items-center justify-center rounded-lg bg-[linear-gradient(90deg,#f4c4ff_0%,#ffd9b5_100%)] px-7 text-[17px] font-medium text-black">
        Thanks! You&apos;re on the waitlist.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col sm:flex-row items-center justify-center gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        disabled={status === "loading"}
        className="h-14 w-full max-w-[320px] rounded-lg border border-black/10 bg-white px-4 text-[17px] text-black placeholder:text-black/40 focus:border-black/30 focus:outline-none focus:ring-4 focus:ring-black/5 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-lg bg-[linear-gradient(90deg,#f4c4ff_0%,#ffd9b5_100%)] px-7 text-[17px] font-medium text-black disabled:opacity-50"
      >
        {status === "loading" ? "Joining..." : "Join waitlist"}
      </button>
      {status === "error" && <p className="absolute -bottom-8 text-sm text-red-500">{message}</p>}
    </form>
  );
}