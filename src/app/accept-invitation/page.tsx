"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId")?.trim() ?? "";
  const prefillEmail = searchParams.get("email")?.trim() ?? "";
  const prefillFullName = searchParams.get("fullName")?.trim() ?? "";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [didAutoAttempt, setDidAutoAttempt] = useState(false);
  const { data: sessionData, isPending: isSessionPending } = authClient.useSession();
  const isAuthenticated = Boolean(sessionData?.session?.id);
  const encodedInvitationId = encodeURIComponent(invitationId);
  const loginHref = `/login?next=${encodeURIComponent(`/accept-invitation?invitationId=${encodedInvitationId}`)}`;
  const createAccountParams = new URLSearchParams({ invitationId });
  if (prefillEmail) {
    createAccountParams.set("email", prefillEmail);
  }
  if (prefillFullName) {
    createAccountParams.set("fullName", prefillFullName);
  }
  const createAccountHref = `/onboarding?${createAccountParams.toString()}`;

  const acceptInvitation = useCallback(async () => {
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
  }, [invitationId, router]);

  useEffect(() => {
    if (!invitationId || isSessionPending || !isAuthenticated || busy || didAutoAttempt) {
      return;
    }

    setDidAutoAttempt(true);
    void acceptInvitation();
  }, [acceptInvitation, busy, didAutoAttempt, invitationId, isAuthenticated, isSessionPending]);

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-black/10 bg-[#fafafa] p-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-black">Accept invitation</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          {invitationId
            ? "Open this invite link, create an account (or log in), and you will be added to the organization automatically."
            : "Open this page from an invitation link that includes an invitation id."}
        </p>

        {!invitationId ? null : isSessionPending ? (
          <p className="mt-5 text-sm text-black/60">Checking your session...</p>
        ) : isAuthenticated ? (
          <button
            type="button"
            onClick={() => void acceptInvitation()}
            disabled={busy}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Accepting..." : "Accept invitation"}
          </button>
        ) : (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={createAccountHref}
              className="inline-flex h-11 items-center rounded-xl bg-black px-4 text-sm font-medium text-white"
            >
              Create account
            </Link>
            <Link
              href={loginHref}
              className="inline-flex h-11 items-center rounded-xl border border-black/15 px-4 text-sm font-medium text-black"
            >
              Log in
            </Link>
          </div>
        )}

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
