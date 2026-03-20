"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BasisLogo } from "@/components/basis-logo";
import { authClient } from "@/lib/auth-client";

const roleOptions = [
  "Product Designer",
  "Full Stack Engineer",
  "Growth Marketing Lead",
  "Customer Support Lead",
] as const;

const volumeOptions = [
  { value: "focused", label: "Focused search", detail: "1-2 open roles with a tight review loop." },
  { value: "steady", label: "Steady hiring", detail: "A few concurrent searches across one team." },
  { value: "scaled", label: "Scaled hiring", detail: "Multiple roles with heavier coordination needs." },
] as const;

const workflowOptions = [
  { value: "lean", label: "Lean", detail: "Inbox, screen, interview, decide, offer." },
  { value: "structured", label: "Structured", detail: "Adds interviewer handoff and final calibration." },
  { value: "panel", label: "Panel-heavy", detail: "Built for multi-round or committee-based review." },
] as const;

const syncOptions = [
  { value: "async", label: "Mostly async", detail: "Notes and reviews drive the process." },
  { value: "blended", label: "Blended", detail: "Async by default with a weekly hiring review." },
  { value: "live", label: "High-touch", detail: "Frequent syncs, quick decisions, fast loops." },
] as const;

const teammateOptions = [
  "Recruiting",
  "Hiring manager",
  "Design lead",
  "Engineering lead",
  "Founder",
] as const;

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

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId")?.trim() ?? "";
  const prefillFullName = searchParams.get("fullName")?.trim() ?? "";
  const prefillEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const isInvitationSignup = invitationId.length > 0;
  const [step, setStep] = useState<"account" | "organization">("account");
  const [fullName, setFullName] = useState(prefillFullName);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [organizationBusy, setOrganizationBusy] = useState(false);
  const [organizationError, setOrganizationError] = useState("");

  const [workspaceName, setWorkspaceName] = useState("Northstar Studio");
  const [ownerName, setOwnerName] = useState("Manuel");
  const [companyStage, setCompanyStage] = useState("Series A");
  const [hq, setHq] = useState("Vienna");
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Product Designer", "Full Stack Engineer"]);
  const [volume, setVolume] = useState<(typeof volumeOptions)[number]["value"]>("steady");
  const [workflow, setWorkflow] = useState<(typeof workflowOptions)[number]["value"]>("structured");
  const [syncStyle, setSyncStyle] = useState<(typeof syncOptions)[number]["value"]>("blended");
  const [teammates, setTeammates] = useState<string[]>(["Recruiting", "Hiring manager", "Founder"]);
  const [candidateUpdates, setCandidateUpdates] = useState(true);
  const [sharedInbox, setSharedInbox] = useState(true);
  const [introNote, setIntroNote] = useState(
    "We move quickly, keep feedback concrete, and make decisions in one place."
  );

  const toggleRole = (role: string) => {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  };

  const toggleTeammate = (label: string) => {
    setTeammates((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  const moveToOrganizationStep = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setAccountError("Please complete all account fields first.");
      return;
    }

    if (password.length < 8) {
      setAccountError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setAccountError("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setAccountError("Please accept the terms to continue.");
      return;
    }

    setAccountError("");
    setAccountNotice("");

    setAccountBusy(true);
    try {
      const result = await authClient.signUp.email({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setAccountError(result.error.message ?? "Could not create account.");
        return;
      }

      if (isInvitationSignup) {
        setAccountNotice("Account created. Accepting invitation...");

        const acceptResult = await authClient.organization.acceptInvitation({ invitationId });
        if (acceptResult.error) {
          setAccountError(acceptResult.error.message ?? "Could not accept invitation.");
          setAccountNotice("");
          return;
        }

        setAccountNotice("Invitation accepted. Redirecting to your workspace...");

        try {
          const response = await fetch("/api/workspace", { cache: "no-store" });
          const payload = await response.json() as { workspaceId?: string };
          const nextHref = payload.workspaceId
            ? `/platform?workspaceId=${encodeURIComponent(payload.workspaceId)}`
            : "/platform";

          router.push(nextHref);
        } catch {
          router.push("/platform");
        }

        return;
      }

      setStep("organization");
    } catch {
      setAccountError("Unexpected error while creating account.");
    } finally {
      setAccountBusy(false);
    }
  };

  const createOrganization = async () => {
    if (!workspaceName.trim()) {
      setOrganizationError("Workspace name is required.");
      return;
    }

    setOrganizationError("");
    setOrganizationBusy(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          workspaceName,
          ownerName,
          companyStage,
          headquarters: hq,
          selectedRoles,
          volume,
          workflow,
          syncStyle,
          teammates,
          candidateUpdates,
          sharedInbox,
          introNote,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        workspaceId?: string;
      };

      if (!response.ok || !result.success) {
        setOrganizationError(result.message ?? "Failed to create organization.");
        return;
      }

      router.push(`/platform${result.workspaceId ? `?workspaceId=${result.workspaceId}` : ""}`);
    } catch {
      setOrganizationError("Unexpected error while creating organization.");
    } finally {
      setOrganizationBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] p-4 sm:p-8 lg:p-12 overflow-hidden flex flex-col font-sans antialiased selection:bg-black/10">
      <div className="relative mx-auto w-full max-w-[1240px] flex-1 text-[#111111]">
        {/* Persistent left/right borders */}
        <div className="absolute -bottom-[100vh] -top-[100vh] left-0 w-px bg-black/[0.08]" />
        <div className="absolute -bottom-[100vh] -top-[100vh] right-0 w-px bg-black/[0.08]" />

        <BlockDivider />

        {/* Top Nav */}
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3 text-[14px]">
          <div className="scale-75 origin-left">
            <BasisLogo />
          </div>
          <span className="text-black/30">/</span>
          <span className="font-medium text-black/70">
            {isInvitationSignup
              ? "Join Organization"
              : step === "account"
                ? "Create Account"
                : "Create Organization"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[14px] font-medium text-black/60 transition-colors duration-150 hover:text-black active:scale-[0.98]">
            Cancel
          </Link>
          {step === "account" ? (
            <button
              type="button"
              onClick={moveToOrganizationStep}
              disabled={accountBusy}
              className="inline-flex h-9 items-center rounded-md bg-black px-4 text-[14px] font-medium text-white transition-all duration-150 ease-out hover:bg-black/80 hover:shadow-md active:scale-[0.98]"
            >
              {accountBusy ? "Creating account..." : isInvitationSignup ? "Create account" : "Continue"}
            </button>
          ) : isInvitationSignup ? null : (
            <>
              <button
                type="button"
                onClick={() => setStep("account")}
                className="text-[14px] font-medium text-black/60 transition-colors duration-150 hover:text-black active:scale-[0.98]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={createOrganization}
                disabled={organizationBusy}
                className="inline-flex h-9 items-center rounded-md bg-black px-4 text-[14px] font-medium text-white transition-all duration-150 ease-out hover:bg-black/80 hover:shadow-md active:scale-[0.98]"
              >
                {organizationBusy ? "Creating organization..." : "Create organization"}
              </button>
            </>
          )}
        </div>
      </header>

      <BlockDivider />

      {/* Document Body */}
      <div className="flex justify-center px-4 py-16 sm:px-8 sm:py-24 lg:px-10 min-h-[80vh]">
        <div className="w-full max-w-[640px]">
          {step === "account" ? (
            <section className="rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-sm sm:p-8 relative">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-black/45">
              {isInvitationSignup ? "Invitation" : "Step 1 of 2"}
            </p>
            <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-[-0.02em] text-black sm:text-[40px]">
              {isInvitationSignup ? "Create your account to join" : "Create your account"}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-black/62">
              {isInvitationSignup
                ? "You were invited to an organization. Create your account to accept the invitation and continue."
                : "Start by creating your personal account. You can set up your organization in the next step."}
            </p>

            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[14px] font-medium text-black/72">Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.12] bg-white px-4 py-3 text-[15px] text-black outline-none transition-all focus:border-black/25 focus:shadow-sm"
                  placeholder="Jane Doe"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-medium text-black/72">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.12] bg-white px-4 py-3 text-[15px] text-black outline-none transition-all focus:border-black/25 focus:shadow-sm"
                  placeholder="you@company.com"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[14px] font-medium text-black/72">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.12] bg-white px-4 py-3 text-[15px] text-black outline-none transition-all focus:border-black/25 focus:shadow-sm"
                    placeholder="At least 8 characters"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[14px] font-medium text-black/72">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.12] bg-white px-4 py-3 text-[15px] text-black outline-none transition-all focus:border-black/25 focus:shadow-sm"
                    placeholder="Repeat password"
                  />
                </label>
              </div>

              <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.08] bg-[#fafafa] p-3">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={() => setAcceptTerms(!acceptTerms)}
                  className="mt-[2px] h-4 w-4 rounded-sm border-black/20 accent-black"
                />
                <span className="text-[13px] leading-relaxed text-black/62">
                  I agree to the Terms and Privacy Policy.
                </span>
              </label>

              {accountError ? (
                <p className="text-[13px] font-medium text-[#b3261e]">{accountError}</p>
              ) : null}
              {accountNotice ? (
                <p className="text-[13px] font-medium text-black/65">{accountNotice}</p>
              ) : null}

              <button
                type="button"
                onClick={moveToOrganizationStep}
                disabled={accountBusy}
                className="mt-2 inline-flex h-11 items-center rounded-xl bg-black px-5 text-[14px] font-medium text-white transition-all duration-150 ease-out hover:bg-black/80"
              >
                {accountBusy
                  ? "Creating account..."
                  : isInvitationSignup
                    ? "Create account and join"
                    : "Continue to organization setup"}
              </button>
            </div>
          </section>
        ) : (
          <>
        {/* Cover / Icon area equivalent */}
        <div className="group relative mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.08] text-3xl cursor-pointer hover:shadow-md transition-all duration-150 ease-out active:scale-[0.96]">
          <span className="opacity-90 transition-transform duration-300 group-hover:scale-110">🏢</span>
        </div>

        {/* Title input (H1) */}
        <input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="Untitled workspace"
          className="w-full bg-transparent text-[36px] font-bold leading-tight tracking-[-0.02em] text-black placeholder:text-black/20 text-balance outline-none sm:text-[44px] transition-colors focus:placeholder:text-black/10 mb-6"
        />

        {/* Properties area */}
        <div className="flex flex-col gap-1.5 mb-12">
          <div className="group flex items-center text-[15px] rounded-xl hover:bg-black/[0.03] p-2 transition-colors -ml-2">
            <div className="w-[140px] flex items-center gap-2.5 text-black/50 font-medium ml-2">
              <span className="text-[17px] leading-none opacity-80">👤</span> Owner
            </div>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="flex-1 bg-transparent text-black outline-none placeholder:text-black/30 px-2 py-1 rounded-md transition-colors focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-black/[0.08]"
              placeholder="Empty"
            />
          </div>
          <div className="group flex items-center text-[15px] rounded-xl hover:bg-black/[0.03] p-2 transition-colors -ml-2">
            <div className="w-[140px] flex items-center gap-2.5 text-black/50 font-medium ml-2">
              <span className="text-[17px] leading-none opacity-80">📈</span> Stage
            </div>
            <input
              value={companyStage}
              onChange={(e) => setCompanyStage(e.target.value)}
              className="flex-1 bg-transparent text-black outline-none placeholder:text-black/30 px-2 py-1 rounded-md transition-colors focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-black/[0.08]"
              placeholder="Empty"
            />
          </div>
          <div className="group flex items-center text-[15px] rounded-xl hover:bg-black/[0.03] p-2 transition-colors -ml-2">
            <div className="w-[140px] flex items-center gap-2.5 text-black/50 font-medium ml-2">
              <span className="text-[17px] leading-none opacity-80">📍</span> Location
            </div>
            <input
              value={hq}
              onChange={(e) => setHq(e.target.value)}
              className="flex-1 bg-transparent text-black outline-none placeholder:text-black/30 px-2 py-1 rounded-md transition-colors focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-black/[0.08]"
              placeholder="Empty"
            />
          </div>
        </div>

        {/* Blocks Area */}
        <div className="space-y-12 border-t border-black/[0.06] pt-10">
          {/* Roles */}
          <section>
            <h2 className="mb-4 text-[16px] font-semibold text-black tracking-tight">Roles to open</h2>
            <div className="flex flex-wrap gap-2.5">
              {roleOptions.map((role) => {
                const active = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`inline-flex items-center rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-all duration-150 ease-out active:scale-[0.98] ${
                      active
                        ? "border-black/20 bg-white shadow-sm ring-1 ring-black/[0.04] text-black"
                        : "border-black/[0.08] bg-transparent text-black/60 hover:border-black/[0.15] hover:bg-black/[0.01] hover:text-black"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Configuration Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="mb-4 text-[16px] font-semibold text-black tracking-tight">Hiring pace</h2>
              <div className="space-y-3">
                {volumeOptions.map((option) => {
                  const active = option.value === volume;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVolume(option.value)}
                      className={`relative flex w-full flex-col rounded-2xl border p-4 text-left transition-all duration-150 ease-out active:scale-[0.98] ${
                        active
                          ? "border-black/20 bg-white shadow-sm ring-1 ring-black/[0.04]"
                          : "border-black/[0.08] hover:border-black/[0.15] hover:bg-black/[0.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[14px] font-semibold text-black">{option.label}</span>
                        {active && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black">
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.6667 3.5L5.25001 9.91667L2.33334 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-black/60 leading-relaxed text-pretty">{option.detail}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-[16px] font-semibold text-black tracking-tight">Default workflow</h2>
              <div className="space-y-3">
                {workflowOptions.map((option) => {
                  const active = option.value === workflow;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setWorkflow(option.value)}
                      className={`relative flex w-full flex-col rounded-2xl border p-4 text-left transition-all duration-150 ease-out active:scale-[0.98] ${
                        active
                          ? "border-black/20 bg-white shadow-sm ring-1 ring-black/[0.04]"
                          : "border-black/[0.08] hover:border-black/[0.15] hover:bg-black/[0.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[14px] font-semibold text-black">{option.label}</span>
                        {active && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black">
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.6667 3.5L5.25001 9.91667L2.33334 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-black/60 leading-relaxed text-pretty">{option.detail}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <section>
            <h2 className="mb-4 text-[16px] font-semibold text-black tracking-tight">Decision rhythm</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {syncOptions.map((option) => {
                const active = option.value === syncStyle;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSyncStyle(option.value)}
                    className={`relative flex flex-col rounded-2xl border p-4 text-left transition-all duration-150 ease-out active:scale-[0.98] ${
                      active
                        ? "border-black/20 bg-white shadow-sm ring-1 ring-black/[0.04]"
                        : "border-black/[0.08] hover:border-black/[0.15] hover:bg-black/[0.01]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-[14px] font-semibold text-black">{option.label}</span>
                      {active && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black">
                         <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path d="M11.6667 3.5L5.25001 9.91667L2.33334 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                         </svg>
                       </span>
                      )}
                    </div>
                    <div className="text-[13px] text-black/60 leading-relaxed text-pretty">{option.detail}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[16px] font-semibold text-black tracking-tight">Core collaborators</h2>
            <div className="flex flex-wrap gap-2.5">
              {teammateOptions.map((option) => {
                const active = teammates.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleTeammate(option)}
                    className={`inline-flex items-center rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-all duration-150 ease-out active:scale-[0.98] ${
                      active
                        ? "border-black/20 bg-white shadow-sm ring-1 ring-black/[0.04] text-black"
                        : "border-black/[0.08] bg-transparent text-black/60 hover:border-black/[0.15] hover:bg-black/[0.01] hover:text-black"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[16px] font-semibold text-black tracking-tight">Communication rules</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col rounded-2xl border border-black/[0.08] bg-white p-4 hover:border-black/[0.15] hover:shadow-sm cursor-pointer transition-all duration-150 ease-out active:scale-[0.98]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[14px] font-semibold text-black">Candidate updates</span>
                  <input 
                    type="checkbox" 
                    checked={candidateUpdates}
                    onChange={() => setCandidateUpdates(!candidateUpdates)}
                    className="h-4 w-4 rounded-sm border-black/20 accent-black cursor-pointer transition-transform active:scale-[0.9]"
                  />
                </div>
                <div className="text-[13px] text-black/60 leading-relaxed text-pretty">Send a structured status update after each stage change.</div>
              </label>
              <label className="flex flex-col rounded-2xl border border-black/[0.08] bg-white p-4 hover:border-black/[0.15] hover:shadow-sm cursor-pointer transition-all duration-150 ease-out active:scale-[0.98]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[14px] font-semibold text-black">Shared inbox</span>
                  <input 
                    type="checkbox" 
                    checked={sharedInbox}
                    onChange={() => setSharedInbox(!sharedInbox)}
                    className="h-4 w-4 rounded-sm border-black/20 accent-black cursor-pointer transition-transform active:scale-[0.9]"
                  />
                </div>
                <div className="text-[13px] text-black/60 leading-relaxed text-pretty">Keep recruiter and hiring manager replies in one thread.</div>
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[16px] font-semibold text-black tracking-tight">Internal welcome note</h2>
            <div className="rounded-2xl border border-black/[0.08] bg-white p-1 shadow-sm transition-all focus-within:border-black/20 focus-within:ring-1 focus-within:ring-black/[0.04]">
              <textarea
                value={introNote}
                onChange={(e) => setIntroNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-transparent p-4 text-[14px] leading-relaxed text-black outline-none placeholder:text-black/30 resize-none text-pretty"
              />
            </div>
          </section>

          {organizationError ? (
            <p className="text-[13px] font-medium text-[#b3261e]">{organizationError}</p>
          ) : null}
        </div>
          </>
        )}
        </div>
      </div>
      
      <BlockDivider />
      </div>
    </main>
  );
}
