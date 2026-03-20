import React from "react";
import { notFound } from "next/navigation";

import { ApplicationForm } from "./application-form";
import { BasisLogo } from "@/components/basis-logo";
import { sql } from "@/lib/db/client";

type JobRow = {
  id: string;
  title: string;
  company_name: string;
  location: string;
  employment_type: string | null;
  min_salary: string | null;
  max_salary: string | null;
  salary_currency: string | null;
  description_md: string | null;
  requirements_md: string | null;
};

function formatEmploymentType(value: string | null) {
  if (!value) {
    return "Full-Time";
  }

  return value
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function formatSalary(min: string | null, max: string | null, currency: string | null) {
  if (!min && !max) {
    return "Compensation discussed in process";
  }

  const currencyLabel = currency || "USD";
  const toAmount = (value: string | null) => {
    if (!value) {
      return null;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyLabel,
      maximumFractionDigits: 0,
    }).format(numeric);
  };

  const minLabel = toAmount(min);
  const maxLabel = toAmount(max);

  if (minLabel && maxLabel) {
    return `${minLabel} - ${maxLabel}`;
  }

  return minLabel || maxLabel || "Compensation discussed in process";
}

export default async function JobApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;

  const jobs = await sql<JobRow[]>`
    SELECT
      j.id,
      j.title,
      COALESCE(o.name, 'Basis') AS company_name,
      COALESCE(l.name, w.headquarters_location, 'Remote') AS location,
      j.employment_type,
      j.min_salary::text AS min_salary,
      j.max_salary::text AS max_salary,
      j.salary_currency,
      j.description_md,
      j.requirements_md
    FROM jobs j
    JOIN workspaces w ON w.id = j.workspace_id
    JOIN organizations o ON o.id = w.organization_id
    LEFT JOIN locations l ON l.id = j.location_id
    WHERE (j.id::text = ${jobId} OR j.slug = ${jobId})
      AND j.status IN ('published', 'draft', 'paused')
    LIMIT 1
  `;

  const job = jobs[0];

  if (!job) {
    notFound();
  }

  const requirements = (job.requirements_md || "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mb-8 flex items-center justify-between">
        <BasisLogo />
      </div>

      <div className="w-full max-w-4xl space-y-8">
        
        {/* Job Details Section */}
        <div className="bg-white shadow rounded-lg p-8">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="mt-2 text-lg text-gray-600">
              {job.company_name} • {job.location} • {formatEmploymentType(job.employment_type)}
            </p>
            <p className="mt-1 text-sm text-gray-500">Ref: {job.id}</p>
          </div>

          <div className="prose max-w-none text-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">About the Role</h3>
            <p className="mb-6">{job.description_md || "Role details will be shared during the process."}</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Requirements</h3>
            <ul className="list-disc pl-5 space-y-2 mb-6 text-gray-700">
              {(requirements.length ? requirements : ["Relevant experience for the role"]).map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Compensation</h3>
            <p>{formatSalary(job.min_salary, job.max_salary, job.salary_currency)}</p>
          </div>
        </div>

        {/* Application Form Section */}
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for this position</h2>

          <ApplicationForm jobId={job.id} />
        </div>

      </div>
    </div>
  );
}