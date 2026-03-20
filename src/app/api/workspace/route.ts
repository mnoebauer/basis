import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { sql } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { resolveWorkspaceId } from "@/lib/platform-data";

type MembershipRole = "owner" | "admin" | "recruiter" | "hiring_manager" | "interviewer" | "viewer";
type HiringVolume = "focused" | "steady" | "scaled";
type WorkflowStyle = "lean" | "structured" | "panel";
type DecisionRhythm = "async" | "blended" | "live";

const membershipRoles: MembershipRole[] = [
  "owner",
  "admin",
  "recruiter",
  "hiring_manager",
  "interviewer",
  "viewer",
];

const hiringVolumeValues = new Set<HiringVolume>(["focused", "steady", "scaled"]);
const workflowStyleValues = new Set<WorkflowStyle>(["lean", "structured", "panel"]);
const decisionRhythmValues = new Set<DecisionRhythm>(["async", "blended", "live"]);

type WorkspaceAction =
  | {
      action: "update-workspace";
      workspaceId?: string;
      workspaceName?: string;
      timezone?: string;
      companyStage?: string;
      headquarters?: string;
      ownerName?: string;
      hiringVolume?: string;
      workflowStyle?: string;
      decisionRhythm?: string;
      candidateUpdatesEnabled?: boolean;
      sharedInboxEnabled?: boolean;
      introNote?: string;
    }
  | {
      action: "invite-member";
      workspaceId?: string;
      email: string;
      fullName?: string;
      role: string;
    }
  | {
      action: "resend-invitation";
      workspaceId?: string;
      invitationId: string;
    }
  | {
      action: "cancel-invitation";
      workspaceId?: string;
      invitationId: string;
    }
  | {
      action: "update-member-role";
      workspaceId?: string;
      userId: string;
      role: string;
    }
  | {
      action: "remove-member";
      workspaceId?: string;
      userId: string;
    };

type OrganizationApi = {
  createOrganization: (args: {
    body: {
      name: string;
      slug: string;
      userId?: string;
      keepCurrentActiveOrganization?: boolean;
    };
    headers: Headers;
  }) => Promise<unknown>;
  listMembers: (args: { query: { organizationId: string; limit?: number }; headers: Headers }) => Promise<unknown>;
  createInvitation: (args: {
    body: { email: string; role: string; organizationId: string; resend?: boolean };
    headers: Headers;
  }) => Promise<unknown>;
  listInvitations: (args: {
    query: { organizationId?: string };
    headers: Headers;
  }) => Promise<unknown>;
  cancelInvitation: (args: {
    body: { invitationId: string };
    headers: Headers;
  }) => Promise<unknown>;
  updateMemberRole: (args: {
    body: { memberId: string; role: string; organizationId: string };
    headers: Headers;
  }) => Promise<unknown>;
  removeMember: (args: {
    body: { memberIdOrEmail: string; organizationId: string };
    headers: Headers;
  }) => Promise<unknown>;
};

type AuthSessionApi = {
  getSession: (args: { headers: Headers }) => Promise<
    | {
        session?: { activeOrganizationId?: string | null };
      }
    | null
    | undefined
  >;
  setActiveOrganization: (args: {
    body: { organizationId?: string | null; organizationSlug?: string };
    headers: Headers;
  }) => Promise<unknown>;
};

const organizationApi = auth.api as unknown as OrganizationApi;
const authSessionApi = auth.api as unknown as AuthSessionApi;

async function resolveAuthHeaders(request: Request) {
  const resolved = await nextHeaders();
  // In route handlers this should include cookies/session; keep request headers as a fallback.
  return resolved.get("cookie") ? resolved : request.headers;
}

function isMembershipRole(value: string): value is MembershipRole {
  return membershipRoles.includes(value as MembershipRole);
}

function sanitizeEnum<T extends string>(
  input: string | undefined,
  allowed: Set<T>,
  fallback: T,
): T {
  if (input && allowed.has(input as T)) {
    return input as T;
  }

  return fallback;
}

function formatTime(timestamp?: string | null) {
  if (!timestamp) {
    return null;
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.valueOf())) {
    return timestamp;
  }

  return parsed.toISOString();
}

function toOrganizationRole(role: MembershipRole): "owner" | "admin" | "member" {
  if (role === "owner") return "owner";
  if (role === "admin") return "admin";
  return "member";
}

function fromOrganizationRole(role: string): MembershipRole {
  if (role === "owner") return "owner";
  if (role === "admin") return "admin";
  return "viewer";
}

async function listOrganizationMembers(organizationId: string, headers: Headers) {
  const result = await organizationApi.listMembers({
    query: { organizationId, limit: 200 },
    headers,
  });

  const parsed = (result ?? {}) as {
    members?: Array<{
      id?: string;
      userId?: string;
      role?: string;
      createdAt?: Date | string;
      user?: { email?: string; name?: string; createdAt?: Date | string };
    }>;
    data?: Array<{
      id?: string;
      userId?: string;
      role?: string;
      createdAt?: Date | string;
      user?: { email?: string; name?: string; createdAt?: Date | string };
    }>;
  };

  const rows = (parsed.members ?? parsed.data ?? []) as Array<{
    id?: string;
    userId?: string;
    role?: string;
    createdAt?: Date | string;
    user?: { email?: string; name?: string; createdAt?: Date | string };
  }>;

  return rows.map((item) => ({
    userId: item.userId ?? item.id ?? "",
    email: item.user?.email ?? "unknown@unknown.local",
    fullName: item.user?.name ?? null,
    role: fromOrganizationRole(item.role ?? "member"),
    status: "active" as const,
    invitedAt: null,
    joinedAt: formatTime(String(item.createdAt ?? item.user?.createdAt ?? null)),
  }));
}

async function listOrganizationInvitations(organizationId: string, headers: Headers) {
  const result = await organizationApi.listInvitations({
    query: { organizationId },
    headers,
  });

  const parsed = (result ?? {}) as {
    invitations?: Array<{
      id: string;
      email: string;
      role?: string;
      status?: string;
      createdAt?: Date | string;
    }>;
    data?: Array<{
      id: string;
      email: string;
      role?: string;
      status?: string;
      createdAt?: Date | string;
    }>;
  };

  const rows = parsed.invitations ?? parsed.data ?? [];

  return rows
    .filter((item) => (item.status ?? "pending") === "pending")
    .map((item) => ({
      invitationId: item.id,
      email: item.email,
      role: fromOrganizationRole(item.role ?? "member"),
      status: "pending" as const,
      invitedAt: formatTime(String(item.createdAt ?? null)),
    }));
}

async function syncActiveOrganizationForWorkspace(workspaceId: string, headers: Headers) {
  const mapped = await getWorkspaceOrganizationId(workspaceId);
  if (!mapped) {
    return;
  }

  const authOrganizationId = await ensureWorkspaceAuthOrganizationId(workspaceId, headers);

  try {
    await authSessionApi.setActiveOrganization({
      body: {
        organizationId: authOrganizationId,
      },
      headers,
    });
  } catch {
    // If no session is present we can't persist active org in a cookie-backed session.
  }
}

async function resolveActiveOrganizationId(headers: Headers) {
  try {
    const session = await authSessionApi.getSession({ headers });
    return session?.session?.activeOrganizationId ?? null;
  } catch {
    return null;
  }
}

async function getWorkspaceOrganizationId(workspaceId: string) {
  const mapped = await sql<{ organization_name: string; organization_slug: string; auth_organization_id: string | null }[]>`
    SELECT
      o.name AS organization_name,
      o.slug AS organization_slug,
      ao.id AS auth_organization_id
    FROM workspaces w
    JOIN organizations o ON o.id = w.organization_id
    LEFT JOIN auth_organizations ao ON ao.slug = o.slug
    WHERE w.id = ${workspaceId}
    LIMIT 1
  `;

  return mapped[0] ?? null;
}

async function ensureWorkspaceAuthOrganizationId(workspaceId: string, headers: Headers) {
  const mapped = await getWorkspaceOrganizationId(workspaceId);

  if (!mapped) {
    throw new Error("Workspace is missing organization linkage.");
  }

  if (mapped.auth_organization_id) {
    return mapped.auth_organization_id;
  }

  try {
    await organizationApi.createOrganization({
      body: {
        name: mapped.organization_name,
        slug: mapped.organization_slug,
        keepCurrentActiveOrganization: true,
      },
      headers,
    });
  } catch {
    // Continue; the organization may already exist and only require re-querying.
  }

  const refreshed = await sql<{ auth_organization_id: string | null }[]>`
    SELECT
      ao.id AS auth_organization_id
    FROM organizations o
    LEFT JOIN auth_organizations ao ON ao.slug = o.slug
    JOIN workspaces w ON w.organization_id = o.id
    WHERE w.id = ${workspaceId}
    LIMIT 1
  `;

  const authOrganizationId = refreshed[0]?.auth_organization_id;

  if (!authOrganizationId) {
    throw new Error("Workspace organization is not linked to Better Auth organization data.");
  }

  return authOrganizationId;
}

async function buildWorkspacePayload(workspaceId: string, headers: Headers) {
  const workspaceRows = await sql<
    {
      id: string;
      organization_id: string;
      auth_organization_id: string | null;
      name: string;
      timezone: string;
      company_stage: string | null;
      headquarters_location: string | null;
      organization_name: string;
      organization_slug: string;
      owner_name: string | null;
      hiring_volume: HiringVolume | null;
      default_workflow_style: WorkflowStyle | null;
      decision_rhythm: DecisionRhythm | null;
      candidate_updates_enabled: boolean | null;
      shared_inbox_enabled: boolean | null;
      intro_note: string | null;
      created_at: string;
      onboarding_completed_at: string | null;
    }[]
  >`
    SELECT
      w.id,
      w.organization_id,
      ao.id AS auth_organization_id,
      w.name,
      w.timezone,
      w.company_stage,
      w.headquarters_location,
      o.name AS organization_name,
      o.slug AS organization_slug,
      wop.owner_name,
      wop.hiring_volume,
      wop.default_workflow_style,
      wop.decision_rhythm,
      wop.candidate_updates_enabled,
      wop.shared_inbox_enabled,
      wop.intro_note,
      w.created_at::text AS created_at,
      w.onboarding_completed_at::text AS onboarding_completed_at
    FROM workspaces w
    JOIN organizations o ON o.id = w.organization_id
    LEFT JOIN auth_organizations ao ON ao.slug = o.slug
    LEFT JOIN workspace_onboarding_profiles wop ON wop.workspace_id = w.id
    WHERE w.id = ${workspaceId}
    LIMIT 1
  `;

  const workspace = workspaceRows[0];

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const authOrganizationId = workspace.auth_organization_id
    ?? await ensureWorkspaceAuthOrganizationId(workspaceId, headers);

  const members = await listOrganizationMembers(authOrganizationId, headers);
  const invitations = await listOrganizationInvitations(authOrganizationId, headers);

  return {
    success: true,
    workspaceId,
    workspace: {
      id: workspace.id,
      organizationId: workspace.organization_id,
      name: workspace.name,
      timezone: workspace.timezone,
      companyStage: workspace.company_stage,
      headquarters: workspace.headquarters_location,
      organizationName: workspace.organization_name,
      organizationSlug: workspace.organization_slug,
      ownerName: workspace.owner_name,
      hiringVolume: workspace.hiring_volume ?? "steady",
      workflowStyle: workspace.default_workflow_style ?? "structured",
      decisionRhythm: workspace.decision_rhythm ?? "blended",
      candidateUpdatesEnabled: workspace.candidate_updates_enabled ?? true,
      sharedInboxEnabled: workspace.shared_inbox_enabled ?? true,
      introNote: workspace.intro_note,
      createdAt: formatTime(workspace.created_at),
      onboardingCompletedAt: formatTime(workspace.onboarding_completed_at),
    },
    members,
    invitations,
    availableRoles: membershipRoles,
  };
}

export async function GET(request: Request) {
  try {
    const authHeaders = await resolveAuthHeaders(request);
    const { searchParams } = new URL(request.url);
    const preferredWorkspaceId = searchParams.get("workspaceId") ?? undefined;

    const activeOrganizationId = await resolveActiveOrganizationId(authHeaders);
    const workspaceId = await resolveWorkspaceId(preferredWorkspaceId, activeOrganizationId);

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "No workspace found.",
        },
        { status: 404 },
      );
    }

    if (preferredWorkspaceId && workspaceId) {
      await syncActiveOrganizationForWorkspace(workspaceId, authHeaders);
    }

    return NextResponse.json(await buildWorkspacePayload(workspaceId, authHeaders));
  } catch (error) {
    console.error("Failed to load workspace settings", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load workspace settings.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeaders = await resolveAuthHeaders(request);
    const body = (await request.json()) as Partial<WorkspaceAction>;

    if (!body.action) {
      return NextResponse.json({ success: false, message: "Missing action." }, { status: 400 });
    }

    const activeOrganizationId = await resolveActiveOrganizationId(authHeaders);
    const workspaceId = await resolveWorkspaceId(body.workspaceId, activeOrganizationId);
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Workspace not found." }, { status: 404 });
    }

    if (body.workspaceId && workspaceId) {
      await syncActiveOrganizationForWorkspace(workspaceId, authHeaders);
    }

    if (body.action === "update-workspace") {
      const workspaceName = body.workspaceName?.trim();
      if (!workspaceName) {
        return NextResponse.json(
          { success: false, message: "Workspace name is required." },
          { status: 400 },
        );
      }

      const timezone = body.timezone?.trim() || "UTC";
      const companyStage = body.companyStage?.trim() || null;
      const headquarters = body.headquarters?.trim() || null;

      await sql`
        UPDATE workspaces
        SET
          name = ${workspaceName},
          timezone = ${timezone},
          company_stage = ${companyStage},
          headquarters_location = ${headquarters},
          updated_at = NOW()
        WHERE id = ${workspaceId}
      `;

      const currentProfileRows = await sql<
        {
          owner_name: string | null;
          hiring_volume: HiringVolume | null;
          default_workflow_style: WorkflowStyle | null;
          decision_rhythm: DecisionRhythm | null;
          candidate_updates_enabled: boolean | null;
          shared_inbox_enabled: boolean | null;
          intro_note: string | null;
        }[]
      >`
        SELECT
          owner_name,
          hiring_volume,
          default_workflow_style,
          decision_rhythm,
          candidate_updates_enabled,
          shared_inbox_enabled,
          intro_note
        FROM workspace_onboarding_profiles
        WHERE workspace_id = ${workspaceId}
        LIMIT 1
      `;

      const currentProfile = currentProfileRows[0];
      const ownerName = body.ownerName?.trim() || currentProfile?.owner_name || null;
      const hiringVolume = sanitizeEnum(
        body.hiringVolume,
        hiringVolumeValues,
        currentProfile?.hiring_volume ?? "steady",
      );
      const workflowStyle = sanitizeEnum(
        body.workflowStyle,
        workflowStyleValues,
        currentProfile?.default_workflow_style ?? "structured",
      );
      const decisionRhythm = sanitizeEnum(
        body.decisionRhythm,
        decisionRhythmValues,
        currentProfile?.decision_rhythm ?? "blended",
      );
      const candidateUpdatesEnabled =
        body.candidateUpdatesEnabled ?? currentProfile?.candidate_updates_enabled ?? true;
      const sharedInboxEnabled = body.sharedInboxEnabled ?? currentProfile?.shared_inbox_enabled ?? true;
      const introNote = body.introNote?.trim() || currentProfile?.intro_note || null;

      await sql`
        INSERT INTO workspace_onboarding_profiles (
          workspace_id,
          owner_name,
          hiring_volume,
          default_workflow_style,
          decision_rhythm,
          candidate_updates_enabled,
          shared_inbox_enabled,
          intro_note
        )
        VALUES (
          ${workspaceId},
          ${ownerName},
          ${hiringVolume},
          ${workflowStyle},
          ${decisionRhythm},
          ${candidateUpdatesEnabled},
          ${sharedInboxEnabled},
          ${introNote}
        )
        ON CONFLICT (workspace_id) DO UPDATE SET
          owner_name = EXCLUDED.owner_name,
          hiring_volume = EXCLUDED.hiring_volume,
          default_workflow_style = EXCLUDED.default_workflow_style,
          decision_rhythm = EXCLUDED.decision_rhythm,
          candidate_updates_enabled = EXCLUDED.candidate_updates_enabled,
          shared_inbox_enabled = EXCLUDED.shared_inbox_enabled,
          intro_note = EXCLUDED.intro_note,
          updated_at = NOW()
      `;
    }

    if (body.action === "invite-member") {
      const email = body.email?.trim().toLowerCase();

      if (!email || !email.includes("@")) {
        return NextResponse.json({ success: false, message: "A valid email is required." }, { status: 400 });
      }

      if (!body.role || !isMembershipRole(body.role)) {
        return NextResponse.json({ success: false, message: "Invalid role." }, { status: 400 });
      }

      const organizationId = await ensureWorkspaceAuthOrganizationId(workspaceId, authHeaders);
      await organizationApi.createInvitation({
        body: {
          email,
          role: toOrganizationRole(body.role),
          organizationId,
          resend: true,
        },
        headers: authHeaders,
      });
    }

    if (body.action === "resend-invitation") {
      if (!body.invitationId) {
        return NextResponse.json({ success: false, message: "Missing invitation id." }, { status: 400 });
      }

      const organizationId = await ensureWorkspaceAuthOrganizationId(workspaceId, authHeaders);
      const invitations = await listOrganizationInvitations(organizationId, authHeaders);
      const invitation = invitations.find((item) => item.invitationId === body.invitationId);

      if (!invitation) {
        return NextResponse.json({ success: false, message: "Invitation not found." }, { status: 404 });
      }

      await organizationApi.createInvitation({
        body: {
          email: invitation.email,
          role: toOrganizationRole(invitation.role),
          organizationId,
          resend: true,
        },
        headers: authHeaders,
      });
    }

    if (body.action === "cancel-invitation") {
      if (!body.invitationId) {
        return NextResponse.json({ success: false, message: "Missing invitation id." }, { status: 400 });
      }

      await organizationApi.cancelInvitation({
        body: { invitationId: body.invitationId },
        headers: authHeaders,
      });
    }

    if (body.action === "update-member-role") {
      if (!body.userId) {
        return NextResponse.json({ success: false, message: "Missing member user id." }, { status: 400 });
      }

      if (body.userId.startsWith("invite:")) {
        return NextResponse.json(
          { success: false, message: "Pending invitations cannot be re-roled. Cancel and re-invite." },
          { status: 400 },
        );
      }

      if (!body.role || !isMembershipRole(body.role)) {
        return NextResponse.json({ success: false, message: "Invalid role." }, { status: 400 });
      }

      const organizationId = await ensureWorkspaceAuthOrganizationId(workspaceId, authHeaders);
      const organizationMembers = await listOrganizationMembers(organizationId, authHeaders);
      const currentMember = organizationMembers.find((member) => member.userId === body.userId);
      const currentRole = currentMember?.role;

      if (!currentRole) {
        return NextResponse.json({ success: false, message: "Member not found." }, { status: 404 });
      }

      if (currentRole === "owner" && body.role !== "owner") {
        const ownerCount = organizationMembers.filter((member) => member.role === "owner").length;
        if (ownerCount <= 1) {
          return NextResponse.json(
            { success: false, message: "Workspace must have at least one owner." },
            { status: 400 },
          );
        }
      }

      await organizationApi.updateMemberRole({
        body: {
          memberId: body.userId,
          role: toOrganizationRole(body.role),
          organizationId,
        },
        headers: authHeaders,
      });
    }

    if (body.action === "remove-member") {
      if (!body.userId) {
        return NextResponse.json({ success: false, message: "Missing member user id." }, { status: 400 });
      }

      if (body.userId.startsWith("invite:")) {
        await organizationApi.cancelInvitation({
          body: { invitationId: body.userId.slice("invite:".length) },
          headers: authHeaders,
        });

        return NextResponse.json(await buildWorkspacePayload(workspaceId, authHeaders));
      }

      const organizationId = await ensureWorkspaceAuthOrganizationId(workspaceId, authHeaders);
      const organizationMembers = await listOrganizationMembers(organizationId, authHeaders);
      const member = organizationMembers.find((item) => item.userId === body.userId);
      const memberRole = member?.role;

      if (!memberRole) {
        return NextResponse.json({ success: false, message: "Member not found." }, { status: 404 });
      }

      if (memberRole === "owner") {
        const ownerCount = organizationMembers.filter((item) => item.role === "owner").length;
        if (ownerCount <= 1) {
          return NextResponse.json(
            { success: false, message: "Cannot remove the only owner." },
            { status: 400 },
          );
        }
      }

      await organizationApi.removeMember({
        body: {
          memberIdOrEmail: member.email,
          organizationId,
        },
        headers: authHeaders,
      });
    }

    return NextResponse.json(await buildWorkspacePayload(workspaceId, authHeaders));
  } catch (error) {
    console.error("Failed to update workspace settings", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update workspace settings.",
      },
      { status: 500 },
    );
  }
}
