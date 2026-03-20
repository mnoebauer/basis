import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { sql } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import {
  ensureDefaultStages,
  resolveActor,
  resolveWorkspaceId,
  slugify,
  toStageLabel,
  toStageType,
} from "@/lib/platform-data";

type PlatformAction =
  | {
      action: "create-job";
      workspaceId?: string;
      title: string;
      employmentType?: "full_time" | "part_time" | "contract" | "internship" | "temporary";
      workplaceType?: "remote" | "hybrid" | "onsite";
      description?: string;
      requirements?: string;
    }
  | {
      action: "move-stage";
      workspaceId?: string;
      applicationId: string;
      targetStage: string;
    }
  | {
      action: "add-comment";
      workspaceId?: string;
      applicationId: string;
      body: string;
    }
  | {
      action: "add-review";
      workspaceId?: string;
      applicationId: string;
      body: string;
      recommendation: string;
    }
  | {
      action: "save-notes";
      workspaceId?: string;
      applicationId: string;
      content: string;
    }
  | {
      action: "send-message";
      workspaceId?: string;
      applicationId: string;
      body: string;
    };

const reviewRecommendationMap: Record<string, string> = {
  Advance: "yes",
  Hold: "mixed",
  Hire: "strong_yes",
  Reject: "no",
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

const authSessionApi = auth.api as unknown as AuthSessionApi;

async function resolveAuthHeaders(request: Request) {
  const resolved = await nextHeaders();
  return resolved.get("cookie") ? resolved : request.headers;
}

async function resolveActiveOrganizationId(headers: Headers) {
  try {
    const session = await authSessionApi.getSession({ headers });
    return session?.session?.activeOrganizationId ?? null;
  } catch {
    return null;
  }
}

async function syncActiveOrganizationForWorkspace(workspaceId: string, headers: Headers) {
  const rows = await sql<{ auth_organization_id: string | null }[]>`
    SELECT ao.id AS auth_organization_id
    FROM workspaces w
    JOIN organizations o ON o.id = w.organization_id
    LEFT JOIN auth_organizations ao ON ao.slug = o.slug
    WHERE w.id = ${workspaceId}
    LIMIT 1
  `;

  const organizationId = rows[0]?.auth_organization_id;
  if (!organizationId) {
    return;
  }

  try {
    await authSessionApi.setActiveOrganization({
      body: { organizationId },
      headers,
    });
  } catch {
    // Ignore session sync failures when the request is not authenticated.
  }
}

function formatTimeLabel(timestamp?: string | null) {
  if (!timestamp) {
    return "just now";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.valueOf())) {
    return "just now";
  }

  return date.toLocaleString();
}

async function getPlatformPayload(workspaceId: string) {
  const actor = await resolveActor(workspaceId);

  const jobs = await sql<
    {
      id: string;
      slug: string;
      title: string;
      candidate_count: string;
      active_count: string;
      stage_count: string;
      latest_activity: string | null;
      created_at: string;
    }[]
  >`
    SELECT
      j.id,
      j.slug,
      j.title,
      COUNT(DISTINCT a.id)::text AS candidate_count,
      COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END)::text AS active_count,
      COUNT(DISTINCT js.id)::text AS stage_count,
      MAX(COALESCE(a.last_activity_at, a.application_submitted_at, a.updated_at))::text AS latest_activity,
      j.created_at::text AS created_at
    FROM jobs j
    LEFT JOIN applications a ON a.job_id = j.id
    LEFT JOIN job_stages js ON js.job_id = j.id
    WHERE j.workspace_id = ${workspaceId}
      AND j.status <> 'archived'
    GROUP BY j.id, j.slug, j.title, j.created_at
    ORDER BY j.created_at DESC
  `;

  const applications = await sql<
    {
      application_id: string;
      job_id: string;
      job_title: string;
      candidate_id: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      email: string | null;
      phone: string | null;
      github_url: string | null;
      location_text: string | null;
      source_name: string | null;
      source_type: string | null;
      summary: string | null;
      current_stage_type: string | null;
      last_activity: string | null;
      resume_url: string | null;
      cover_letter: string | null;
      metadata: unknown;
    }[]
  >`
    SELECT
      a.id AS application_id,
      a.job_id,
      j.title AS job_title,
      c.id AS candidate_id,
      c.first_name,
      c.last_name,
      c.full_name,
      c.email,
      c.phone,
      c.github_url,
      c.location_text,
      src.source_name,
      src.source_type,
      c.current_title AS summary,
      js.stage_type AS current_stage_type,
      COALESCE(a.last_activity_at, a.application_submitted_at, a.updated_at)::text AS last_activity,
      a.resume_url,
      a.cover_letter,
      c.metadata
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN candidates c ON c.id = a.candidate_id
    LEFT JOIN job_stages js ON js.id = a.current_stage_id
    LEFT JOIN application_sources src ON src.id = a.source_id
    WHERE a.workspace_id = ${workspaceId}
    ORDER BY COALESCE(a.last_activity_at, a.application_submitted_at, a.updated_at) DESC
  `;

  const candidateItems = await Promise.all(
    applications.map(async (application) => {
      const answerRows = await sql<{ question: string; answer: string }[]>`
        SELECT
          q.prompt AS question,
          COALESCE(ans.answer_text, ans.answer_json::text, '') AS answer
        FROM application_answers ans
        JOIN application_questions q ON q.id = ans.question_id
        WHERE ans.application_id = ${application.application_id}
        ORDER BY q.position ASC
      `;

      const commentRows = await sql<{ author: string; body: string; time: string }[]>`
        SELECT
          COALESCE(u.full_name, SPLIT_PART(u.email, '@', 1), 'Hiring team') AS author,
          n.content_md AS body,
          n.created_at::text AS time
        FROM notes n
        JOIN app_users u ON u.id = n.author_user_id
        WHERE n.application_id = ${application.application_id}
          AND n.visibility IN ('internal', 'hiring_team')
        ORDER BY n.created_at ASC
      `;

      const noteRow = await sql<{ content_md: string }[]>`
        SELECT content_md
        FROM notes
        WHERE application_id = ${application.application_id}
          AND visibility = 'private'
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1
      `;

      const reviewRows = await sql<
        { author: string; recommendation: string | null; body: string | null; time: string | null }[]
      >`
        SELECT
          COALESCE(u.full_name, SPLIT_PART(u.email, '@', 1), 'Hiring team') AS author,
          r.recommendation,
          r.summary AS body,
          COALESCE(r.submitted_at, r.updated_at)::text AS time
        FROM review_scorecards r
        JOIN app_users u ON u.id = r.reviewer_user_id
        WHERE r.application_id = ${application.application_id}
        ORDER BY COALESCE(r.submitted_at, r.updated_at) ASC
      `;

      const messageRows = await sql<{ sender: string; body: string; time: string }[]>`
        SELECT
          CASE
            WHEN m.sender_type = 'candidate' THEN COALESCE(c.full_name, c.email, 'Candidate')
            WHEN m.sender_type = 'user' THEN COALESCE(u.full_name, SPLIT_PART(u.email, '@', 1), 'Hiring team')
            ELSE 'System'
          END AS sender,
          COALESCE(m.body_text, '') AS body,
          COALESCE(m.sent_at, m.created_at)::text AS time
        FROM message_threads t
        JOIN messages m ON m.thread_id = t.id
        LEFT JOIN app_users u ON u.id = m.sender_user_id
        LEFT JOIN candidates c ON c.id = m.candidate_id
        WHERE t.application_id = ${application.application_id}
        ORDER BY COALESCE(m.sent_at, m.created_at) ASC
      `;

      const fileRows = await sql<{ name: string; size_bytes: string | null }[]>`
        SELECT
          file_name AS name,
          file_size_bytes::text AS size_bytes
        FROM file_attachments
        WHERE application_id = ${application.application_id}
        ORDER BY created_at DESC
      `;

      const name =
        application.full_name?.trim() ||
        `${application.first_name ?? ""} ${application.last_name ?? ""}`.trim() ||
        application.email ||
        "Unnamed candidate";

      const sourceLabel = application.source_name || "Career page";
      const sourceType = application.source_type || "career_page";

      const badge = `Applied via ${sourceLabel}`;
      const activityLabel = application.last_activity
        ? `Last activity · ${formatTimeLabel(application.last_activity)}`
        : "New applicant";

      return {
        id: application.candidate_id,
        applicationId: application.application_id,
        jobId: application.job_id,
        name,
        stage: toStageLabel(application.current_stage_type || "inbox"),
        badge,
        role: application.job_title,
        email: application.email || "No email",
        phone: application.phone || "No phone",
        github: application.github_url || "No github link",
        location: application.location_text || "Unknown location",
        source: `${sourceLabel} (${sourceType})`,
        summary: application.summary || application.cover_letter || "No summary provided yet.",
        responses: answerRows,
        resume: [
          {
            heading: "Resume",
            items: [
              application.resume_url || "No resume link provided",
              application.cover_letter || "No cover letter provided",
            ],
          },
        ],
        messages: messageRows.map((item) => ({ ...item, time: formatTimeLabel(item.time) })),
        files: fileRows.map((item) => ({
          name: item.name,
          meta: item.size_bytes ? `${Math.round(Number(item.size_bytes) / 1024)} KB` : "File",
        })),
        notes: noteRow[0]?.content_md || "",
        comments: commentRows.map((item) => ({ ...item, time: formatTimeLabel(item.time) })),
        reviews: reviewRows.map((item) => ({
          author: item.author,
          recommendation: item.recommendation || "mixed",
          body: item.body || "",
          time: formatTimeLabel(item.time),
        })),
        activity: activityLabel,
      };
    }),
  );

  return {
    success: true,
    workspaceId,
    actorName: actor.actorName,
    jobs: jobs.map((job) => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      candidateCount: Number(job.candidate_count),
      activeCount: Number(job.active_count),
      stageCount: Number(job.stage_count),
      latestActivity: job.latest_activity
        ? formatTimeLabel(job.latest_activity)
        : "No recent activity",
    })),
    candidates: candidateItems,
  };
}

export async function GET(request: Request) {
  try {
    const authHeaders = await resolveAuthHeaders(request);
    const activeOrganizationId = await resolveActiveOrganizationId(authHeaders);
    const { searchParams } = new URL(request.url);
    const preferredWorkspaceId = searchParams.get("workspaceId") ?? undefined;

    const workspaceId = await resolveWorkspaceId(preferredWorkspaceId, activeOrganizationId);

    if (!workspaceId) {
      return NextResponse.json({
        success: true,
        workspaceId: null,
        actorName: "Hiring team",
        jobs: [],
        candidates: [],
      });
    }

    if (preferredWorkspaceId && workspaceId) {
      await syncActiveOrganizationForWorkspace(workspaceId, authHeaders);
    }

    const payload = await getPlatformPayload(workspaceId);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to load platform data", error);
    return NextResponse.json(
      { success: false, message: "Failed to load platform data." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeaders = await resolveAuthHeaders(request);
    const activeOrganizationId = await resolveActiveOrganizationId(authHeaders);
    const body = (await request.json()) as Partial<PlatformAction>;

    if (!body.action) {
      return NextResponse.json({ success: false, message: "Action is required." }, { status: 400 });
    }

    const workspaceId = await resolveWorkspaceId(body.workspaceId, activeOrganizationId);

    if (body.workspaceId && workspaceId) {
      await syncActiveOrganizationForWorkspace(workspaceId, authHeaders);
    }

    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Workspace not found." }, { status: 404 });
    }

    const actor = await resolveActor(workspaceId);

    if (body.action === "create-job") {
      const title = body.title?.trim();

      if (!title) {
        return NextResponse.json({ success: false, message: "Job title is required." }, { status: 400 });
      }

      const employmentType = body.employmentType ?? "full_time";
      const workplaceType = body.workplaceType ?? "remote";
      const description = body.description?.trim() || null;
      const requirements = body.requirements?.trim() || null;

      const baseSlug = slugify(title) || "job";
      let createdJobId: string | null = null;

      for (let attempt = 0; attempt < 24; attempt++) {
        const candidateSlug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

        const rows = await sql<{ id: string }[]>`
          INSERT INTO jobs (
            workspace_id,
            title,
            slug,
            employment_type,
            workplace_type,
            status,
            description_md,
            requirements_md,
            created_by_user_id,
            published_at
          )
          VALUES (
            ${workspaceId},
            ${title},
            ${candidateSlug},
            ${employmentType},
            ${workplaceType},
            'published',
            ${description},
            ${requirements},
            ${actor.userId},
            NOW()
          )
          ON CONFLICT (workspace_id, slug) DO NOTHING
          RETURNING id
        `;

        if (rows[0]?.id) {
          createdJobId = rows[0].id;
          break;
        }
      }

      if (!createdJobId) {
        return NextResponse.json(
          { success: false, message: "Could not create job due to a slug conflict." },
          { status: 409 },
        );
      }

      await ensureDefaultStages(createdJobId);
    }

    if (body.action === "move-stage") {
      if (!body.applicationId || !body.targetStage) {
        return NextResponse.json({ success: false, message: "Missing stage payload." }, { status: 400 });
      }

      const applicationRows = await sql<{ job_id: string; current_stage_id: string | null }[]>`
        SELECT job_id, current_stage_id
        FROM applications
        WHERE id = ${body.applicationId}
          AND workspace_id = ${workspaceId}
        LIMIT 1
      `;

      const application = applicationRows[0];

      if (!application) {
        return NextResponse.json({ success: false, message: "Application not found." }, { status: 404 });
      }

      const stageType = toStageType(body.targetStage);

      const targetRows = await sql<{ id: string }[]>`
        SELECT id
        FROM job_stages
        WHERE job_id = ${application.job_id}
          AND stage_type = ${stageType}
        ORDER BY position ASC
        LIMIT 1
      `;

      let targetStageId = targetRows[0]?.id;

      if (!targetStageId) {
        const inserted = await sql<{ id: string }[]>`
          INSERT INTO job_stages (job_id, name, stage_type, position, is_terminal)
          VALUES (
            ${application.job_id},
            ${body.targetStage},
            ${stageType},
            COALESCE((SELECT MAX(position) + 1 FROM job_stages WHERE job_id = ${application.job_id}), 1),
            ${stageType === "declined" || stageType === "archive"}
          )
          RETURNING id
        `;

        targetStageId = inserted[0]?.id;
      }

      if (!targetStageId) {
        return NextResponse.json({ success: false, message: "Could not resolve target stage." }, { status: 500 });
      }

      await sql`
        UPDATE applications
        SET current_stage_id = ${targetStageId},
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = ${body.applicationId}
          AND workspace_id = ${workspaceId}
      `;

      await sql`
        INSERT INTO stage_transitions (application_id, from_stage_id, to_stage_id, moved_by_user_id, moved_at)
        VALUES (${body.applicationId}, ${application.current_stage_id}, ${targetStageId}, ${actor.userId}, NOW())
      `;
    }

    if (body.action === "add-comment") {
      const content = body.body?.trim();

      if (!body.applicationId || !content) {
        return NextResponse.json({ success: false, message: "Comment is required." }, { status: 400 });
      }

      await sql`
        INSERT INTO notes (application_id, author_user_id, content_md, visibility)
        VALUES (${body.applicationId}, ${actor.userId}, ${content}, 'internal')
      `;

      await sql`
        UPDATE applications
        SET last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = ${body.applicationId}
          AND workspace_id = ${workspaceId}
      `;
    }

    if (body.action === "add-review") {
      const summary = body.body?.trim();

      if (!body.applicationId || !summary) {
        return NextResponse.json({ success: false, message: "Review body is required." }, { status: 400 });
      }

      const recommendation = reviewRecommendationMap[body.recommendation ?? ""] ?? "mixed";

      await sql`
        INSERT INTO review_scorecards (application_id, reviewer_user_id, recommendation, summary, submitted_at)
        VALUES (${body.applicationId}, ${actor.userId}, ${recommendation}, ${summary}, NOW())
        ON CONFLICT (application_id, reviewer_user_id) DO UPDATE SET
          recommendation = EXCLUDED.recommendation,
          summary = EXCLUDED.summary,
          submitted_at = NOW(),
          updated_at = NOW()
      `;

      await sql`
        UPDATE applications
        SET last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = ${body.applicationId}
          AND workspace_id = ${workspaceId}
      `;
    }

    if (body.action === "save-notes") {
      if (!body.applicationId || typeof body.content !== "string") {
        return NextResponse.json({ success: false, message: "Notes content is required." }, { status: 400 });
      }

      const existing = await sql<{ id: string }[]>`
        SELECT id
        FROM notes
        WHERE application_id = ${body.applicationId}
          AND author_user_id = ${actor.userId}
          AND visibility = 'private'
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      const content = body.content.trim();

      if (existing[0]?.id) {
        await sql`
          UPDATE notes
          SET content_md = ${content},
              updated_at = NOW()
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql`
          INSERT INTO notes (application_id, author_user_id, content_md, visibility)
          VALUES (${body.applicationId}, ${actor.userId}, ${content}, 'private')
        `;
      }

      await sql`
        UPDATE applications
        SET last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = ${body.applicationId}
          AND workspace_id = ${workspaceId}
      `;
    }

    if (body.action === "send-message") {
      const messageBody = body.body?.trim();

      if (!body.applicationId || !messageBody) {
        return NextResponse.json({ success: false, message: "Message is required." }, { status: 400 });
      }

      const threadRows = await sql<{ id: string }[]>`
        SELECT id
        FROM message_threads
        WHERE application_id = ${body.applicationId}
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      let threadId = threadRows[0]?.id;

      if (!threadId) {
        const inserted = await sql<{ id: string }[]>`
          INSERT INTO message_threads (application_id, channel, subject, created_by_user_id)
          VALUES (${body.applicationId}, 'email', 'Candidate communication', ${actor.userId})
          RETURNING id
        `;

        threadId = inserted[0]?.id;
      }

      if (!threadId) {
        return NextResponse.json({ success: false, message: "Could not open message thread." }, { status: 500 });
      }

      const candidateRows = await sql<{ candidate_id: string }[]>`
        SELECT candidate_id
        FROM applications
        WHERE id = ${body.applicationId}
          AND workspace_id = ${workspaceId}
        LIMIT 1
      `;

      await sql`
        INSERT INTO messages (thread_id, sender_type, sender_user_id, candidate_id, body_text, sent_at)
        VALUES (
          ${threadId},
          'user',
          ${actor.userId},
          ${candidateRows[0]?.candidate_id ?? null},
          ${messageBody},
          NOW()
        )
      `;

      await sql`
        UPDATE message_threads
        SET updated_at = NOW()
        WHERE id = ${threadId}
      `;

      await sql`
        UPDATE applications
        SET last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = ${body.applicationId}
          AND workspace_id = ${workspaceId}
      `;
    }

    const payload = await getPlatformPayload(workspaceId);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to mutate platform data", error);
    return NextResponse.json(
      { success: false, message: "Failed to update platform data." },
      { status: 500 },
    );
  }
}
