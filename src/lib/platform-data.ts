import { sql } from "@/lib/db/client";

export const stageTypeOrder = [
  "inbox",
  "screen",
  "interview",
  "decision",
  "offer",
  "declined",
  "archive",
] as const;

export type StageType = (typeof stageTypeOrder)[number];

const stageLabelByType: Record<StageType, string> = {
  inbox: "Inbox",
  screen: "Screen",
  interview: "Interview",
  decision: "Decide",
  offer: "Offer",
  declined: "Declined",
  archive: "Archive",
};

const stageTypeByLabel = Object.fromEntries(
  Object.entries(stageLabelByType).map(([type, label]) => [label, type]),
) as Record<string, StageType>;

export function toStageLabel(stageType: string): string {
  if (stageType in stageLabelByType) {
    return stageLabelByType[stageType as StageType];
  }

  if (!stageType) {
    return "Inbox";
  }

  return stageType.charAt(0).toUpperCase() + stageType.slice(1);
}

export function toStageType(stageLabel: string): StageType {
  return stageTypeByLabel[stageLabel] ?? "inbox";
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function resolveWorkspaceId(
  preferredWorkspaceId?: string,
  activeOrganizationId?: string | null,
) {
  if (preferredWorkspaceId) {
    const rows = await sql<{ id: string }[]>`
      SELECT id
      FROM workspaces
      WHERE id = ${preferredWorkspaceId}
      LIMIT 1
    `;

    if (rows[0]?.id) {
      return rows[0].id;
    }
  }

  if (activeOrganizationId) {
    const activeRows = await sql<{ id: string }[]>`
      SELECT w.id
      FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      JOIN auth_organizations ao ON ao.slug = o.slug
      WHERE ao.id = ${activeOrganizationId}
      ORDER BY COALESCE(w.onboarding_completed_at, w.created_at) DESC
      LIMIT 1
    `;

    if (activeRows[0]?.id) {
      return activeRows[0].id;
    }
  }

  const latest = await sql<{ id: string }[]>`
    SELECT id
    FROM workspaces
    ORDER BY COALESCE(onboarding_completed_at, created_at) DESC
    LIMIT 1
  `;

  return latest[0]?.id ?? null;
}

export async function resolveActor(workspaceId: string) {
  const actorRows = await sql<{ user_id: string; actor_name: string }[]>`
    SELECT
      wm.user_id,
      COALESCE(wop.owner_name, au.full_name, SPLIT_PART(au.email, '@', 1), 'Hiring team') AS actor_name
    FROM workspace_memberships wm
    JOIN app_users au ON au.id = wm.user_id
    LEFT JOIN workspace_onboarding_profiles wop ON wop.workspace_id = wm.workspace_id
    WHERE wm.workspace_id = ${workspaceId}
    ORDER BY
      CASE wm.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'recruiter' THEN 3
        ELSE 4
      END,
      wm.joined_at NULLS LAST,
      au.created_at
    LIMIT 1
  `;

  if (actorRows[0]) {
    return {
      userId: actorRows[0].user_id,
      actorName: actorRows[0].actor_name,
    };
  }

  const fallbackEmail = `workspace-${workspaceId.slice(0, 8)}@basis.local`;
  const fallbackName = "Hiring team";

  const inserted = await sql<{ id: string }[]>`
    INSERT INTO app_users (email, full_name)
    VALUES (${fallbackEmail}, ${fallbackName})
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      updated_at = NOW()
    RETURNING id
  `;

  const userId = inserted[0]?.id;

  if (!userId) {
    throw new Error("Unable to resolve actor user");
  }

  await sql`
    INSERT INTO workspace_memberships (workspace_id, user_id, role, joined_at)
    VALUES (${workspaceId}, ${userId}, 'owner', NOW())
    ON CONFLICT (workspace_id, user_id) DO NOTHING
  `;

  return {
    userId,
    actorName: fallbackName,
  };
}

export async function ensureDefaultStages(jobId: string) {
  const existing = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM job_stages
    WHERE job_id = ${jobId}
  `;

  if (Number(existing[0]?.count ?? "0") > 0) {
    return;
  }

  for (const [index, stageType] of stageTypeOrder.entries()) {
    await sql`
      INSERT INTO job_stages (job_id, name, stage_type, position, is_terminal)
      VALUES (
        ${jobId},
        ${toStageLabel(stageType)},
        ${stageType},
        ${index + 1},
        ${stageType === "declined" || stageType === "archive"}
      )
      ON CONFLICT (job_id, position) DO NOTHING
    `;
  }
}

export async function ensureWorkspaceJobs(workspaceId: string) {
  const roleRows = await sql<{ role_name: string }[]>`
    SELECT role_name
    FROM onboarding_target_roles
    WHERE workspace_id = ${workspaceId}
    ORDER BY created_at ASC
  `;

  for (const roleRow of roleRows) {
    const roleName = roleRow.role_name.trim();
    if (!roleName) {
      continue;
    }

    const baseSlug = slugify(roleName) || "job";
    let resolvedJobId: string | null = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      const slugCandidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

      const rows = await sql<{ id: string }[]>`
        INSERT INTO jobs (workspace_id, title, slug, status, published_at)
        VALUES (${workspaceId}, ${roleName}, ${slugCandidate}, 'published', NOW())
        ON CONFLICT (workspace_id, slug) DO UPDATE SET
          title = EXCLUDED.title,
          status = CASE WHEN jobs.status = 'archived' THEN jobs.status ELSE EXCLUDED.status END,
          updated_at = NOW()
        RETURNING id
      `;

      if (rows[0]?.id) {
        resolvedJobId = rows[0].id;
        break;
      }
    }

    if (resolvedJobId) {
      await ensureDefaultStages(resolvedJobId);
    }
  }

  const jobRows = await sql<{ id: string }[]>`
    SELECT id
    FROM jobs
    WHERE workspace_id = ${workspaceId}
  `;

  for (const job of jobRows) {
    await ensureDefaultStages(job.id);
  }
}
