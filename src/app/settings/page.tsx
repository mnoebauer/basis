"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type MembershipRole = "owner" | "admin" | "recruiter" | "hiring_manager" | "interviewer" | "viewer";
type HiringVolume = "focused" | "steady" | "scaled";
type WorkflowStyle = "lean" | "structured" | "panel";
type DecisionRhythm = "async" | "blended" | "live";

type Member = {
  userId: string;
  email: string;
  fullName: string | null;
  role: MembershipRole;
  status: "active" | "invited";
  invitedAt: string | null;
  joinedAt: string | null;
};

type Invitation = {
  invitationId: string;
  email: string;
  role: MembershipRole;
  status: "pending";
  invitedAt: string | null;
};

type Workspace = {
  id: string;
  name: string;
  timezone: string;
  companyStage: string | null;
  headquarters: string | null;
  organizationName: string;
  organizationSlug: string;
  ownerName: string | null;
  hiringVolume: HiringVolume;
  workflowStyle: WorkflowStyle;
  decisionRhythm: DecisionRhythm;
  candidateUpdatesEnabled: boolean;
  sharedInboxEnabled: boolean;
  introNote: string | null;
};

type WorkspaceSettingsResponse = {
  success: boolean;
  workspaceId?: string;
  message?: string;
  workspace?: Workspace;
  members?: Member[];
  invitations?: Invitation[];
  availableRoles?: MembershipRole[];
};

const roleOptions: { value: MembershipRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring manager" },
  { value: "interviewer", label: "Interviewer" },
  { value: "viewer", label: "Viewer" },
];

const volumeOptions: { value: HiringVolume; label: string }[] = [
  { value: "focused", label: "Focused" },
  { value: "steady", label: "Steady" },
  { value: "scaled", label: "Scaled" },
];

const workflowOptions: { value: WorkflowStyle; label: string }[] = [
  { value: "lean", label: "Lean" },
  { value: "structured", label: "Structured" },
  { value: "panel", label: "Panel" },
];

const decisionOptions: { value: DecisionRhythm; label: string }[] = [
  { value: "async", label: "Async" },
  { value: "blended", label: "Blended" },
  { value: "live", label: "Live" },
];

import { Suspense } from "react";

function WorkspaceSettingsContent() {
  const searchParams = useSearchParams();
  const requestedWorkspaceId = searchParams.get("workspaceId");

  const [workspaceId, setWorkspaceId] = useState<string | null>(requestedWorkspaceId);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [availableRoles, setAvailableRoles] = useState<MembershipRole[]>(roleOptions.map((item) => item.value));

  const [workspaceName, setWorkspaceName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [companyStage, setCompanyStage] = useState("");
  const [headquarters, setHeadquarters] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [hiringVolume, setHiringVolume] = useState<HiringVolume>("steady");
  const [workflowStyle, setWorkflowStyle] = useState<WorkflowStyle>("structured");
  const [decisionRhythm, setDecisionRhythm] = useState<DecisionRhythm>("blended");
  const [candidateUpdatesEnabled, setCandidateUpdatesEnabled] = useState(true);
  const [sharedInboxEnabled, setSharedInboxEnabled] = useState(true);
  const [introNote, setIntroNote] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<MembershipRole>("recruiter");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ownerCount = useMemo(
    () => members.filter((member) => member.role === "owner").length,
    [members],
  );

  const applyPayload = (payload: WorkspaceSettingsResponse) => {
    if (!payload.workspace) {
      return;
    }

    setWorkspaceId(payload.workspaceId ?? payload.workspace.id);
    setWorkspace(payload.workspace);
    setMembers(payload.members ?? []);
    setInvitations(payload.invitations ?? []);
    setAvailableRoles(payload.availableRoles ?? roleOptions.map((item) => item.value));

    setWorkspaceName(payload.workspace.name);
    setTimezone(payload.workspace.timezone || "UTC");
    setCompanyStage(payload.workspace.companyStage || "");
    setHeadquarters(payload.workspace.headquarters || "");
    setOwnerName(payload.workspace.ownerName || "");
    setHiringVolume(payload.workspace.hiringVolume);
    setWorkflowStyle(payload.workspace.workflowStyle);
    setDecisionRhythm(payload.workspace.decisionRhythm);
    setCandidateUpdatesEnabled(payload.workspace.candidateUpdatesEnabled);
    setSharedInboxEnabled(payload.workspace.sharedInboxEnabled);
    setIntroNote(payload.workspace.introNote || "");
  };

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = requestedWorkspaceId
        ? `?workspaceId=${encodeURIComponent(requestedWorkspaceId)}`
        : "";
      const response = await fetch(`/api/workspace${query}`, { cache: "no-store" });
      const payload = (await response.json()) as WorkspaceSettingsResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load workspace settings.");
      }

      applyPayload(payload);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load workspace settings.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [requestedWorkspaceId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const sendAction = async (payload: Record<string, unknown>, successNotice: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...payload, workspaceId }),
      });

      const result = (await response.json()) as WorkspaceSettingsResponse;
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Request failed.");
      }

      applyPayload(result);
      setNotice(successNotice);
      return true;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Request failed.";
      setError(message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveWorkspace = async () => {
    await sendAction(
      {
        action: "update-workspace",
        workspaceName,
        timezone,
        companyStage,
        headquarters,
        ownerName,
        hiringVolume,
        workflowStyle,
        decisionRhythm,
        candidateUpdatesEnabled,
        sharedInboxEnabled,
        introNote,
      },
      "Workspace settings saved.",
    );
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError("Invite email is required.");
      return;
    }

    const ok = await sendAction(
      {
        action: "invite-member",
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
      },
      "Invite sent.",
    );

    if (ok) {
      setInviteEmail("");
      setInviteName("");
      setInviteRole("recruiter");
    }
  };

  const updateMemberRole = async (member: Member, nextRole: MembershipRole) => {
    if (member.role === "owner" && nextRole !== "owner" && ownerCount <= 1) {
      setError("Workspace must have at least one owner.");
      return;
    }

    await sendAction(
      {
        action: "update-member-role",
        userId: member.userId,
        role: nextRole,
      },
      "Member role updated.",
    );
  };

  const removeMember = async (member: Member) => {
    if (member.role === "owner" && ownerCount <= 1) {
      setError("Cannot remove the only owner.");
      return;
    }

    await sendAction(
      {
        action: "remove-member",
        userId: member.userId,
      },
      "Member removed.",
    );
  };

  const resendInvitation = async (invitation: Invitation) => {
    await sendAction(
      {
        action: "resend-invitation",
        invitationId: invitation.invitationId,
      },
      "Invitation resent.",
    );
  };

  const cancelInvitation = async (invitation: Invitation) => {
    await sendAction(
      {
        action: "cancel-invitation",
        invitationId: invitation.invitationId,
      },
      "Invitation canceled.",
    );
  };

  if (loading) {
    return <main className="min-h-screen bg-white p-8 text-lg text-black/70">Loading workspace settings...</main>;
  }

  if (error && !workspace) {
    return (
      <main className="min-h-screen bg-white p-8">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Workspace settings</h1>
        <p className="mt-3 text-black/65">{error}</p>
        <button
          type="button"
          onClick={() => void loadWorkspace()}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-black px-4 text-sm font-medium text-white"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/8 pb-6">
          <div>
            <p className="text-sm text-black/45">{workspace?.organizationName}</p>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-black">Workspace settings</h1>
            <p className="mt-2 text-black/60">
              Manage your workspace details, teammate roles, and invitation flow.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/platform${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""}`}
              className="inline-flex h-11 items-center rounded-xl bg-black/6 px-4 text-sm font-medium text-black"
            >
              Back to platform
            </Link>
            <button
              type="button"
              onClick={() => void saveWorkspace()}
              disabled={busy}
              className="inline-flex h-11 items-center rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save changes"}
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-black/8 bg-white p-5">
            <h2 className="text-xl font-semibold text-black">General workspace</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-black/55">
                Workspace name
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-[15px] text-black outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-black/55">
                Timezone
                <input
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-[15px] text-black outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-black/55">
                Company stage
                <input
                  value={companyStage}
                  onChange={(event) => setCompanyStage(event.target.value)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-[15px] text-black outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-black/55">
                Headquarters
                <input
                  value={headquarters}
                  onChange={(event) => setHeadquarters(event.target.value)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-[15px] text-black outline-none"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm text-black/55">
                Owner name
                <input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-[15px] text-black outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-black/55">
                Hiring volume
                <select
                  value={hiringVolume}
                  onChange={(event) => setHiringVolume(event.target.value as HiringVolume)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-[15px] text-black outline-none"
                >
                  {volumeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-black/55">
                Workflow style
                <select
                  value={workflowStyle}
                  onChange={(event) => setWorkflowStyle(event.target.value as WorkflowStyle)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-[15px] text-black outline-none"
                >
                  {workflowOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-black/55">
                Decision rhythm
                <select
                  value={decisionRhythm}
                  onChange={(event) => setDecisionRhythm(event.target.value as DecisionRhythm)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-[15px] text-black outline-none"
                >
                  {decisionOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-5 pb-2 text-sm text-black/70">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={candidateUpdatesEnabled}
                    onChange={(event) => setCandidateUpdatesEnabled(event.target.checked)}
                  />
                  Candidate updates
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sharedInboxEnabled}
                    onChange={(event) => setSharedInboxEnabled(event.target.checked)}
                  />
                  Shared inbox
                </label>
              </div>
            </div>

            <label className="mt-5 block space-y-2 text-sm text-black/55">
              Team intro note
              <textarea
                value={introNote}
                onChange={(event) => setIntroNote(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2.5 text-[15px] text-black outline-none"
              />
            </label>
          </div>

          <aside className="rounded-2xl border border-black/8 bg-[#fafafa] p-5">
            <h2 className="text-xl font-semibold text-black">Invite teammate</h2>
            <p className="mt-2 text-sm leading-6 text-black/60">
              Send invites to new members and assign permissions immediately.
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@company.com"
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-[15px] text-black outline-none"
              />
              <input
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="Full name (optional)"
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-[15px] text-black outline-none"
              />
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as MembershipRole)}
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-[15px] text-black outline-none"
              >
                {roleOptions
                  .filter((option) => availableRoles.includes(option.value))
                  .map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => void inviteMember()}
                disabled={busy}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-black text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "Processing..." : "Invite member"}
              </button>
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-xl font-semibold text-black">Workspace members</h2>
          <p className="mt-2 text-sm text-black/60">
            Active members for this workspace.
          </p>

          <div className="mt-4 space-y-3">
            {members.map((member) => {
              const cannotDowngradeOwner = member.role === "owner" && ownerCount <= 1;

              return (
                <div
                  key={member.userId}
                  className="flex flex-col gap-3 rounded-xl border border-black/8 bg-[#fafafa] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-[16px] font-semibold text-black">
                      {member.fullName || member.email.split("@")[0]}
                    </p>
                    <p className="text-sm text-black/55">{member.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-black/45">
                      Active
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(event) => void updateMemberRole(member, event.target.value as MembershipRole)}
                      disabled={busy}
                      className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm text-black outline-none disabled:opacity-60"
                    >
                      {roleOptions
                        .filter((option) => availableRoles.includes(option.value))
                        .map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void removeMember(member)}
                      disabled={busy || cannotDowngradeOwner}
                      className="inline-flex h-10 items-center rounded-lg bg-black/6 px-3 text-sm font-medium text-black disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-xl font-semibold text-black">Pending invitations</h2>
          <p className="mt-2 text-sm text-black/60">
            Invitations waiting for users to accept.
          </p>

          <div className="mt-4 space-y-3">
            {invitations.length === 0 ? (
              <div className="rounded-xl border border-black/8 bg-[#fafafa] p-4 text-sm text-black/55">
                No pending invitations.
              </div>
            ) : (
              invitations.map((invitation) => (
                <div
                  key={invitation.invitationId}
                  className="flex flex-col gap-3 rounded-xl border border-black/8 bg-[#fafafa] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-[16px] font-semibold text-black">{invitation.email}</p>
                    <p className="text-sm text-black/55">Role: {roleOptions.find((option) => option.value === invitation.role)?.label || invitation.role}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-black/45">
                      Pending{invitation.invitedAt ? ` · Sent ${new Date(invitation.invitedAt).toLocaleString()}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void resendInvitation(invitation)}
                      disabled={busy}
                      className="inline-flex h-10 items-center rounded-lg bg-black px-3 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Resend
                    </button>
                    <button
                      type="button"
                      onClick={() => void cancelInvitation(invitation)}
                      disabled={busy}
                      className="inline-flex h-10 items-center rounded-lg bg-black/6 px-3 text-sm font-medium text-black disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-[#9f2d2d]">{error}</p> : null}
        {notice ? <p className="mt-2 text-sm text-black/60">{notice}</p> : null}
      </div>
    </main>
  );
}

export default function WorkspaceSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <WorkspaceSettingsContent />
    </Suspense>
  );
}
