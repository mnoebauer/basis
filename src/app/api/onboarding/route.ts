import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { randomUUID } from "node:crypto";

import { sql } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { ensureWorkspaceJobs } from "@/lib/platform-data";

type OnboardingPayload = {
  fullName: string;
  email: string;
  workspaceName: string;
  ownerName: string;
  companyStage: string;
  headquarters: string;
  selectedRoles: string[];
  volume: "focused" | "steady" | "scaled";
  workflow: "lean" | "structured" | "panel";
  syncStyle: "async" | "blended" | "live";
  teammates: string[];
  candidateUpdates: boolean;
  sharedInbox: boolean;
  introNote: string;
};

type AuthOrganizationApi = {
  createOrganization: (args: {
    body: {
      name: string;
      slug: string;
      userId?: string;
      keepCurrentActiveOrganization?: boolean;
    };
    headers?: Headers;
  }) => Promise<unknown>;
};

const authOrganizationApi = auth.api as unknown as AuthOrganizationApi;

async function resolveAuthHeaders(request: Request) {
  const resolved = await nextHeaders();
  return resolved.get("cookie") ? resolved : request.headers;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const value = error as {
      message?: string;
      status?: number;
      body?: { message?: string; code?: string };
    };

    if (value.body?.message) {
      return value.body.message;
    }

    if (value.body?.code) {
      return value.body.code;
    }

    if (value.message) {
      return value.message;
    }

    if (value.status) {
      return `status ${value.status}`;
    }
  }

  return "unknown error";
}

async function createAuthOrganizationFallback(
  authUserId: string,
  workspaceName: string,
  slug: string,
) {
  const organizationId = randomUUID();

  const orgRows = await sql<{ id: string }[]>`
    INSERT INTO auth_organizations (id, name, slug, logo, created_at, metadata)
    VALUES (${organizationId}, ${workspaceName}, ${slug}, NULL, NOW(), NULL)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id
  `;

  const createdOrganizationId = orgRows[0]?.id;
  if (!createdOrganizationId) {
    return false;
  }

  await sql`
    INSERT INTO auth_members (id, organization_id, user_id, role, created_at)
    VALUES (${randomUUID()}, ${createdOrganizationId}, ${authUserId}, 'owner', NOW())
    ON CONFLICT DO NOTHING
  `;

  return true;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function withSuffix(base: string, attempt: number): string {
  if (attempt === 0) return base;
  const suffix = `${Date.now().toString(36).slice(-4)}${attempt}`;
  return `${base.slice(0, Math.max(1, 48 - suffix.length - 1))}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const authHeaders = await resolveAuthHeaders(request);
    const body = (await request.json()) as Partial<OnboardingPayload>;

    if (!body.fullName?.trim() || !body.email?.trim() || !body.workspaceName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Missing required onboarding fields." },
        { status: 400 },
      );
    }

    const selectedRoles = (body.selectedRoles ?? []).filter((role) => role.trim().length > 0);
    const teammates = (body.teammates ?? []).filter((item) => item.trim().length > 0);

    const email = body.email.trim().toLowerCase();
    const fullName = body.fullName.trim();
    const workspaceName = body.workspaceName.trim();
    const ownerName = body.ownerName?.trim() || fullName;

    const authUserRows = await sql<{ id: string }[]>`
      SELECT id
      FROM auth_users
      WHERE LOWER(email) = ${email}
      LIMIT 1
    `;

    const authUserId = authUserRows[0]?.id;
    if (!authUserId) {
      return NextResponse.json(
        { success: false, message: "Auth user not found. Please sign up and try again." },
        { status: 400 },
      );
    }

    const userRows = await sql<{ id: string }[]>`
      INSERT INTO app_users (email, full_name)
      VALUES (${email}, ${fullName})
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW()
      RETURNING id
    `;

    const userId = userRows[0]?.id;
    if (!userId) {
      return NextResponse.json({ success: false, message: "Failed to resolve user." }, { status: 500 });
    }

    const baseSlug = slugify(workspaceName) || "workspace";
    let organizationId: string | null = null;
    let createdSlug: string | null = null;
    let lastOrganizationError = "";

    for (let attempt = 0; attempt < 8; attempt++) {
      const candidateSlug = withSuffix(baseSlug, attempt);
      const orgRows = await sql<{ id: string }[]>`
        INSERT INTO organizations (name, slug)
        VALUES (${workspaceName}, ${candidateSlug})
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `;

      if (orgRows[0]?.id) {
        try {
          // Prefer server-side system action without headers using explicit userId.
          await authOrganizationApi.createOrganization({
            body: {
              name: workspaceName,
              slug: candidateSlug,
              userId: authUserId,
              keepCurrentActiveOrganization: true,
            },
          });

          organizationId = orgRows[0].id;
          createdSlug = candidateSlug;
          break;
        } catch (error) {
          lastOrganizationError = getErrorMessage(error);

          // Fallback to session-based creation if user has a valid auth cookie.
          try {
            await authOrganizationApi.createOrganization({
              body: {
                name: workspaceName,
                slug: candidateSlug,
                keepCurrentActiveOrganization: true,
              },
              headers: authHeaders,
            });

            organizationId = orgRows[0].id;
            createdSlug = candidateSlug;
            break;
          } catch (fallbackError) {
            lastOrganizationError = getErrorMessage(fallbackError);

            if (lastOrganizationError.toUpperCase().includes("UNAUTHORIZED")) {
              const createdWithFallback = await createAuthOrganizationFallback(
                authUserId,
                workspaceName,
                candidateSlug,
              );

              if (createdWithFallback) {
                organizationId = orgRows[0].id;
                createdSlug = candidateSlug;
                break;
              }
            }
          }

          // If Better Auth org creation fails for this slug, clean up and try next suffix.
          await sql`
            DELETE FROM organizations
            WHERE id = ${orgRows[0].id}
          `;
        }
      }
    }

    if (!organizationId || !createdSlug) {
      return NextResponse.json(
        {
          success: false,
          message: lastOrganizationError
            ? `Could not create organization. ${lastOrganizationError}`
            : "Could not create organization.",
        },
        { status: 409 },
      );
    }

    const workspaceRows = await sql<{ id: string }[]>`
      INSERT INTO workspaces (
        organization_id,
        name,
        company_stage,
        headquarters_location,
        onboarding_completed_at
      )
      VALUES (
        ${organizationId},
        ${workspaceName},
        ${body.companyStage?.trim() || null},
        ${body.headquarters?.trim() || null},
        NOW()
      )
      RETURNING id
    `;

    const workspaceId = workspaceRows[0]?.id;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Failed to create workspace." }, { status: 500 });
    }

    await sql`
      INSERT INTO workspace_memberships (workspace_id, user_id, role, joined_at)
      VALUES (${workspaceId}, ${userId}, 'owner', NOW())
      ON CONFLICT (workspace_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        joined_at = COALESCE(workspace_memberships.joined_at, EXCLUDED.joined_at)
    `;

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
        ${body.volume ?? "steady"},
        ${body.workflow ?? "structured"},
        ${body.syncStyle ?? "blended"},
        ${Boolean(body.candidateUpdates ?? true)},
        ${Boolean(body.sharedInbox ?? true)},
        ${body.introNote?.trim() || null}
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

    for (const roleName of selectedRoles) {
      await sql`
        INSERT INTO onboarding_target_roles (workspace_id, role_name)
        VALUES (${workspaceId}, ${roleName})
        ON CONFLICT (workspace_id, role_name) DO NOTHING
      `;
    }

    for (const collaborator of teammates) {
      await sql`
        INSERT INTO onboarding_collaborators (workspace_id, collaborator_label)
        VALUES (${workspaceId}, ${collaborator})
        ON CONFLICT (workspace_id, collaborator_label) DO NOTHING
      `;
    }

    await ensureWorkspaceJobs(workspaceId);

    return NextResponse.json({
      success: true,
      workspaceId,
      organizationId,
      organizationSlug: createdSlug,
    });
  } catch (error) {
    console.error("Onboarding persistence failed", error);
    return NextResponse.json(
      { success: false, message: "Failed to persist onboarding." },
      { status: 500 },
    );
  }
}
