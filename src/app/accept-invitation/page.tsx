"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { authClient } from "@/lib/auth-client";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId")?.trim() ?? "";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const acceptInvitation = async () => {
    if (!invitationId) {
      setError("Missing invitation id.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const result = await authClient.organization.acceptInvitation({ invitationId });
      if (result.error) {
        throw new Error(result.error.message || "Failed to accept invitation.");
      }

      setNotice("Invitation accepted. Redirecting to your workspace...");

      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        const payload = await response.json() as { workspaceId?: string };
        const nextHref = payload.workspaceId
          ? `/platform?workspaceId=${encodeURIComponent(payload.workspaceId)}`
          : "/platform";

        router.replace(nextHref);
      } catch {
        router.replace("/platform");
      }
    } catch (acceptError) {
      const message = acceptError instanceof Error
        ? acceptError.message
        : "Failed to accept invitation.";

      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-black/10 bg-[#fafafa] p-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-black">Accept invitation</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          {invitationId
            ? "Use this page while signed in to accept your organization invitation."
            : "Open this page from an invitation link that includes an invitation id."}
        </p>

        <button
          type="button"
          onClick={() => void acceptInvitation()}
          disabled={busy || !invitationId}
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Accepting..." : "Accept invitation"}
        </button>

        {error ? <p className="mt-4 text-sm text-[#9f2d2d]">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-black/65">{notice}</p> : null}

        <div className="mt-6 text-sm">
          <Link href="/platform" className="text-black underline underline-offset-4">
            Go to platform
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
