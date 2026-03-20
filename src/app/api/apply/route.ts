import { NextResponse } from "next/server";

import { sql } from "@/lib/db/client";
import { ensureDefaultStages } from "@/lib/platform-data";

function normalizeResumeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);

    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const jobIdOrSlug = String(formData.get("jobId") ?? "").trim();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const phone = String(formData.get("phone") ?? "").trim();
    const resume = String(formData.get("resume") ?? "").trim();
    const coverLetter = String(formData.get("coverLetter") ?? "").trim();
    const normalizedResumeUrl = normalizeResumeUrl(resume);

    if (!jobIdOrSlug || !firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required application fields." },
        { status: 400 },
      );
    }

    if (resume && !normalizedResumeUrl) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid resume link." },
        { status: 400 },
      );
    }

    const jobRows = await sql<{ id: string; workspace_id: string; title: string }[]>`
      SELECT id, workspace_id, title
      FROM jobs
      WHERE id::text = ${jobIdOrSlug} OR slug = ${jobIdOrSlug}
      LIMIT 1
    `;

    const job = jobRows[0];

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job posting not found." },
        { status: 404 },
      );
    }

    await ensureDefaultStages(job.id);

    const stageRows = await sql<{ id: string }[]>`
      SELECT id
      FROM job_stages
      WHERE job_id = ${job.id}
      ORDER BY position ASC
      LIMIT 1
    `;

    const inboxStageId = stageRows[0]?.id ?? null;

    const existingCandidate = await sql<{ id: string }[]>`
      SELECT id
      FROM candidates
      WHERE workspace_id = ${job.workspace_id}
        AND LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    let candidateId = existingCandidate[0]?.id;
    const fullName = `${firstName} ${lastName}`.trim();

    if (!candidateId) {
      const inserted = await sql<{ id: string }[]>`
        INSERT INTO candidates (
          workspace_id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          current_title
        )
        VALUES (
          ${job.workspace_id},
          ${firstName},
          ${lastName},
          ${fullName},
          ${email},
          ${phone || null},
          ${job.title}
        )
        RETURNING id
      `;

      candidateId = inserted[0]?.id;
    } else {
      await sql`
        UPDATE candidates
        SET
          first_name = ${firstName},
          last_name = ${lastName},
          full_name = ${fullName},
          phone = ${phone || null},
          current_title = ${job.title},
          updated_at = NOW()
        WHERE id = ${candidateId}
      `;
    }

    if (!candidateId) {
      return NextResponse.json(
        { success: false, message: "Could not create candidate." },
        { status: 500 },
      );
    }

    const sourceRows = await sql<{ id: string }[]>`
      INSERT INTO application_sources (workspace_id, source_type, source_name)
      VALUES (${job.workspace_id}, 'career_page', 'Career page')
      ON CONFLICT (workspace_id, source_type, source_name) DO UPDATE SET
        source_name = EXCLUDED.source_name
      RETURNING id
    `;

    const sourceId = sourceRows[0]?.id ?? null;

    await sql`
      INSERT INTO applications (
        workspace_id,
        job_id,
        candidate_id,
        current_stage_id,
        source_id,
        status,
        resume_url,
        cover_letter,
        application_submitted_at,
        last_activity_at
      )
      VALUES (
        ${job.workspace_id},
        ${job.id},
        ${candidateId},
        ${inboxStageId},
        ${sourceId},
        'active',
        ${normalizedResumeUrl},
        ${coverLetter || null},
        NOW(),
        NOW()
      )
      ON CONFLICT (job_id, candidate_id) DO UPDATE SET
        current_stage_id = COALESCE(EXCLUDED.current_stage_id, applications.current_stage_id),
        source_id = EXCLUDED.source_id,
        status = 'active',
        resume_url = EXCLUDED.resume_url,
        cover_letter = EXCLUDED.cover_letter,
        updated_at = NOW(),
        last_activity_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully!",
      jobId: job.id,
      candidateId,
    });
  } catch (error) {
    console.error("Application submission failed", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit application" },
      { status: 500 },
    );
  }
}