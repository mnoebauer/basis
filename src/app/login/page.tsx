"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BasisLogo } from "@/components/basis-logo";
import { authClient } from "@/lib/auth-client";

function BlockDivider() {
  return (
    <div className="relative w-full" aria-hidden="true">
      <div className="absolute -left-[100vw] -right-[100vw] top-0 h-px bg-black/[0.08]" />
      <div className="absolute -left-1 -top-1 text-black/15">
        <svg width="9" height="9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1"/></svg>
      </div>
      <div className="absolute -right-1 -top-1 text-black/15">
        <svg width="9" height="9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1"/></svg>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next")?.trim();
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : "/platform";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Failed to log in");
        setLoading(false);
        return;
      }

      router.push(safeNextPath);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] p-4 sm:p-8 lg:p-12 overflow-hidden flex flex-col">
      <div className="relative mx-auto w-full max-w-[1240px] flex-1 text-[#111111]">
        {/* Persistent left/right borders */}
        <div className="absolute -bottom-[100vh] -top-[100vh] left-0 w-px bg-black/[0.08]" />
        <div className="absolute -bottom-[100vh] -top-[100vh] right-0 w-px bg-black/[0.08]" />
        
        <BlockDivider />

        <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/">
            <BasisLogo />
          </Link>
        </header>

        <BlockDivider />

        <section className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-12 min-h-[70vh]">
          <div className="w-full max-w-[440px] rounded-[24px] bg-white p-8 sm:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-black">
              Welcome back
            </h1>
            <p className="mt-3 text-[1.05rem] text-black/60">
              Log in to your Basis account.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-[14px] text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-black" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-[15px] outline-none transition focus:border-black/30 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-black" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-[15px] outline-none transition focus:border-black/30 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-[15px] font-medium text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-8 text-center text-[14px] text-black/60">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-black hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </section>

        <BlockDivider />
      </div>
    </main>
  );
}
