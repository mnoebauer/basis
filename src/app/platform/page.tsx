"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const stageOrder = ["Inbox", "Screen", "Interview", "Decide", "Offer", "Declined", "Archive"] as const;
const candidateTabs = ["Overview", "Resume", "Messages", "Files", "Notes"] as const;

type Stage = (typeof stageOrder)[number];
type CandidateTab = (typeof candidateTabs)[number];

type Candidate = {
  id: string;
  applicationId: string;
  jobId: string;
  name: string;
  stage: string;
  badge: string;
  role: string;
  email: string;
  phone: string;
  github: string;
  location: string;
  source: string;
  summary: string;
  responses: { question: string; answer: string }[];
  resume: { heading: string; items: string[] }[];
  messages: { sender: string; body: string; time: string }[];
  files: { name: string; meta: string }[];
  notes: string;
  comments: { author: string; body: string; time: string }[];
  reviews: { author: string; recommendation: string; body: string; time: string }[];
  activity: string;
};

type JobOpening = {
  id: string;
  slug: string;
  title: string;
  candidateCount: number;
  activeCount: number;
  stageCount: number;
  latestActivity: string;
};

type PlatformResponse = {
  success: boolean;
  workspaceId: string | null;
  actorName: string;
  jobs: JobOpening[];
  candidates: Candidate[];
  message?: string;
};

const stageIcons: Record<Stage, string> = {
  Inbox: "✦",
  Screen: "◔",
  Interview: "◎",
  Decide: "◇",
  Offer: "✳",
  Declined: "⊘",
  Archive: "⧉",
};

const tabIcons: Record<CandidateTab, string> = {
  Overview: "◫",
  Resume: "⌷",
  Messages: "◧",
  Files: "▣",
  Notes: "☰",
};

const sideLinks = ["Job setup", "Distribution"];

const sideLinkIcons: Record<(typeof sideLinks)[number], string> = {
  "Job setup": "⚙",
  Distribution: "⌁",
};

function toStage(value: string): Stage {
  if (stageOrder.includes(value as Stage)) {
    return value as Stage;
  }

  return "Inbox";
}

function nextStage(stage: Stage) {
  if (stage === "Inbox") return "Screen";
  if (stage === "Screen") return "Interview";
  if (stage === "Interview") return "Decide";
  return null;
}

function formatStageLabel(stage: Stage) {
  return stage === "Decide" ? "Move to Decision" : `Move to ${stage}`;
}

import { Suspense } from "react";

function PlatformContent() {
  const searchParams = useSearchParams();
  const requestedWorkspaceId = searchParams.get("workspaceId");

  const [workspaceId, setWorkspaceId] = useState<string | null>(requestedWorkspaceId);
  const [actorName, setActorName] = useState("Hiring team");
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage>("Inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<CandidateTab>("Overview");

  const [isJobOverviewOpen, setIsJobOverviewOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [commentDraft, setCommentDraft] = useState("");
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewRecommendation, setReviewRecommendation] = useState("Advance");
  const [messageDraft, setMessageDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobEmploymentType, setNewJobEmploymentType] = useState<
    "full_time" | "part_time" | "contract" | "internship" | "temporary"
  >("full_time");
  const [newJobWorkplaceType, setNewJobWorkplaceType] = useState<"remote" | "hybrid" | "onsite">("remote");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [newJobRequirements, setNewJobRequirements] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const resetDrafts = () => {
    setCommentDraft("");
    setReviewDraft("");
    setMessageDraft("");
  };

  const syncSelection = useCallback((nextJobs: JobOpening[], nextCandidates: Candidate[]) => {
    setSelectedJobId((currentJobId) => {
      const validJobId = currentJobId && nextJobs.some((job) => job.id === currentJobId)
        ? currentJobId
        : (nextJobs[0]?.id ?? null);

      setSelectedStage((currentStage) => {
        const currentStageHasCandidate =
          validJobId !== null &&
          nextCandidates.some((candidate) => candidate.jobId === validJobId && toStage(candidate.stage) === currentStage);

        if (currentStageHasCandidate) {
          return currentStage;
        }

        if (validJobId === null) {
          return "Inbox";
        }

        const firstStageWithCandidate = stageOrder.find((stage) =>
          nextCandidates.some((candidate) => candidate.jobId === validJobId && toStage(candidate.stage) === stage),
        );

        return firstStageWithCandidate ?? "Inbox";
      });

      setSelectedId((currentCandidateId) => {
        const stillExists = currentCandidateId && nextCandidates.some((candidate) => candidate.id === currentCandidateId);
        if (stillExists) {
          return currentCandidateId;
        }

        if (!validJobId) {
          return null;
        }

        return nextCandidates.find((candidate) => candidate.jobId === validJobId)?.id ?? null;
      });

      return validJobId;
    });
  }, []);

  const applyPayload = useCallback((payload: PlatformResponse) => {
    setWorkspaceId(payload.workspaceId);
    setActorName(payload.actorName || "Hiring team");
    setJobs(payload.jobs || []);
    setCandidates(payload.candidates || []);
    syncSelection(payload.jobs || [], payload.candidates || []);
  }, [syncSelection]);

  const loadPlatform = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = requestedWorkspaceId
        ? `?workspaceId=${encodeURIComponent(requestedWorkspaceId)}`
        : "";
      const response = await fetch(`/api/platform${query}`, { cache: "no-store" });
      const payload = (await response.json()) as PlatformResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load platform.");
      }

      applyPayload(payload);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load platform.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [applyPayload, requestedWorkspaceId]);

  useEffect(() => {
    void loadPlatform();
  }, [loadPlatform]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const candidatesForSelectedJob = useMemo(
    () => candidates.filter((candidate) => candidate.jobId === selectedJobId),
    [candidates, selectedJobId],
  );

  const stageCounts = useMemo(
    () =>
      stageOrder.map((stage) => ({
        name: stage,
        count: candidatesForSelectedJob.filter((candidate) => toStage(candidate.stage) === stage).length,
      })),
    [candidatesForSelectedJob],
  );

  const filteredCandidates = useMemo(
    () =>
      candidatesForSelectedJob.filter(
        (candidate) =>
          toStage(candidate.stage) === selectedStage &&
          (searchQuery.trim() === "" ||
            `${candidate.name} ${candidate.role} ${candidate.source}`.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [candidatesForSelectedJob, searchQuery, selectedStage],
  );

  const selectedCandidate =
    filteredCandidates.find((candidate) => candidate.id === selectedId) ??
    candidatesForSelectedJob.find((candidate) => candidate.id === selectedId) ??
    filteredCandidates[0] ??
    candidatesForSelectedJob[0] ??
    null;

  useEffect(() => {
    setNotesDraft(selectedCandidate?.notes ?? "");
  }, [selectedCandidate?.id, selectedCandidate?.notes]);

  const mutate = async (payload: Record<string, unknown>) => {
    if (!workspaceId) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, workspaceId }),
      });

      const result = (await response.json()) as PlatformResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update platform.");
      }

      applyPayload(result);
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to update platform.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleStageSelect = (stage: Stage) => {
    setSelectedStage(stage);
    const firstCandidate = candidatesForSelectedJob.find((candidate) => toStage(candidate.stage) === stage);
    setSelectedId(firstCandidate?.id ?? null);
    resetDrafts();
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);

    const firstStage = stageOrder.find((stage) =>
      candidates.some((candidate) => candidate.jobId === jobId && toStage(candidate.stage) === stage),
    ) ?? "Inbox";

    setSelectedStage(firstStage);

    const firstCandidateId = candidates.find(
      (candidate) => candidate.jobId === jobId && toStage(candidate.stage) === firstStage,
    )?.id ?? candidates.find((candidate) => candidate.jobId === jobId)?.id ?? null;

    setSelectedId(firstCandidateId);
    setSelectedTab("Overview");
    setIsJobOverviewOpen(true);
    resetDrafts();
  };

  const handleMoveCandidate = async (targetStage: Stage) => {
    if (!selectedCandidate || busy) {
      return;
    }

    await mutate({
      action: "move-stage",
      applicationId: selectedCandidate.applicationId,
      targetStage,
    });
    setSelectedStage(targetStage);
  };

  const handleArchive = async () => {
    await handleMoveCandidate("Archive");
  };

  const handleAddComment = async () => {
    if (!selectedCandidate || busy) {
      return;
    }

    const trimmed = commentDraft.trim();
    if (!trimmed) {
      return;
    }

    await mutate({
      action: "add-comment",
      applicationId: selectedCandidate.applicationId,
      body: trimmed,
    });
    setCommentDraft("");
  };

  const handleStartReview = async () => {
    if (!selectedCandidate || busy) {
      return;
    }

    const trimmed = reviewDraft.trim();
    if (!trimmed) {
      return;
    }

    await mutate({
      action: "add-review",
      applicationId: selectedCandidate.applicationId,
      body: trimmed,
      recommendation: reviewRecommendation,
    });
    setReviewDraft("");
  };

  const handleSendMessage = async () => {
    if (!selectedCandidate || busy) {
      return;
    }

    const trimmed = messageDraft.trim();
    if (!trimmed) {
      return;
    }

    await mutate({
      action: "send-message",
      applicationId: selectedCandidate.applicationId,
      body: trimmed,
    });
    setMessageDraft("");
  };

  const handleSaveNotes = async () => {
    if (!selectedCandidate || busy) {
      return;
    }

    await mutate({
      action: "save-notes",
      applicationId: selectedCandidate.applicationId,
      content: notesDraft,
    });
  };

  const handleCreateJob = async () => {
    if (!workspaceId || busy) {
      return;
    }

    const title = newJobTitle.trim();
    if (!title) {
      setError("Job title is required.");
      return;
    }

    await mutate({
      action: "create-job",
      title,
      employmentType: newJobEmploymentType,
      workplaceType: newJobWorkplaceType,
      description: newJobDescription,
      requirements: newJobRequirements,
    });

    setIsCreateJobOpen(false);
    setNewJobTitle("");
    setNewJobEmploymentType("full_time");
    setNewJobWorkplaceType("remote");
    setNewJobDescription("");
    setNewJobRequirements("");
  };

  const buildApplyLink = (job: JobOpening) => {
    const baseUrl =
      (typeof window !== "undefined" ? window.location.origin : "") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";

    return `${baseUrl}/jobs/${job.id}`;
  };

  const handleShareJob = async (job: JobOpening | null) => {
    if (!job) {
      return;
    }

    const applyLink = buildApplyLink(job);

    try {
      await navigator.clipboard.writeText(applyLink);
      setShareNotice("Apply link copied to clipboard.");
    } catch {
      setShareNotice(`Copy failed. Use this link: ${applyLink}`);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-white p-8 text-lg text-black/70">Loading hiring workspace...</main>;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white p-8 text-black">
        <p className="text-lg text-[#b3261e]">{error}</p>
        <button
          type="button"
          onClick={() => void loadPlatform()}
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-black px-5 text-white"
        >
          Retry
        </button>
      </main>
    );
  }

  if (!workspaceId || jobs.length === 0) {
    return (
      <main className="min-h-screen bg-white p-8 text-black">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">No workspace data yet</h1>
        <p className="mt-3 text-black/65">Complete onboarding first to create jobs and start receiving applications.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsCreateJobOpen(true)}
            className="inline-flex h-11 items-center rounded-xl bg-black px-5 text-white"
          >
            Create job
          </button>
          <Link href="/onboarding" className="inline-flex h-11 items-center rounded-xl bg-black/[0.06] px-5 text-black">
          Open onboarding
          </Link>
        </div>

        {isCreateJobOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-black">Create a job</h2>
                <button type="button" onClick={() => setIsCreateJobOpen(false)} className="text-2xl text-black/55">
                  ×
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-black/72">Job title</span>
                  <input
                    value={newJobTitle}
                    onChange={(event) => setNewJobTitle(event.target.value)}
                    placeholder="Senior Full Stack Engineer"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-black/72">Employment type</span>
                  <select
                    value={newJobEmploymentType}
                    onChange={(event) =>
                      setNewJobEmploymentType(
                        event.target.value as "full_time" | "part_time" | "contract" | "internship" | "temporary",
                      )
                    }
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  >
                    <option value="full_time">Full time</option>
                    <option value="part_time">Part time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-black/72">Workplace type</span>
                  <select
                    value={newJobWorkplaceType}
                    onChange={(event) => setNewJobWorkplaceType(event.target.value as "remote" | "hybrid" | "onsite")}
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-black/72">Description</span>
                  <textarea
                    value={newJobDescription}
                    onChange={(event) => setNewJobDescription(event.target.value)}
                    className="min-h-[100px] w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-black/72">Requirements</span>
                  <textarea
                    value={newJobRequirements}
                    onChange={(event) => setNewJobRequirements(event.target.value)}
                    className="min-h-[100px] w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateJobOpen(false)}
                  className="inline-flex h-11 items-center rounded-xl bg-black/[0.06] px-5 text-black"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateJob()}
                  className="inline-flex h-11 items-center rounded-xl bg-black px-5 text-white"
                >
                  {busy ? "Creating..." : "Create job"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  const currentStage = selectedCandidate ? toStage(selectedCandidate.stage) : "Inbox";
  const upcomingStage = nextStage(currentStage);
  const isDecisionStage = currentStage === "Decide";

  return (
    <main className="min-h-screen bg-white">
      <div className="min-h-screen bg-white">
        <header className="flex flex-col gap-4 border-b border-black/8 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#d7c3ff_0%,#eecbf2_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              <div className="grid grid-cols-2 gap-1">
                <span className="h-2.5 w-2.5 rounded-full border border-white/70" />
                <span className="h-2.5 w-2.5 rounded-full border border-white/70" />
                <span className="h-2.5 w-2.5 rounded-full border border-white/70" />
                <span className="h-2.5 w-2.5 rounded-full border border-white/70" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.02em] text-black">Basis</p>
              <p className="text-sm text-black/45">Hiring workspace · {actorName}</p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <Link
              href={`/settings${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""}`}
              className="inline-flex h-12 items-center rounded-xl bg-black/6 px-4 text-sm font-medium text-black"
            >
              Workspace settings
            </Link>
            <button
              type="button"
              onClick={() => setIsCreateJobOpen(true)}
              className="inline-flex h-12 items-center rounded-xl bg-black px-4 text-sm font-medium text-white"
            >
              New job
            </button>
            <button
              type="button"
              onClick={() => void handleShareJob(selectedJob)}
              disabled={!selectedJob}
              className="inline-flex h-12 items-center rounded-xl bg-black/6 px-4 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Share apply link
            </button>
            <div className="flex h-14 w-full max-w-[620px] items-center rounded-xl border border-black/10 bg-[#fafafa] px-4">
              <span className="mr-3 text-xl text-black/35">⌕</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search applicants"
                className="w-full bg-transparent text-[16px] text-black outline-none placeholder:text-black/40"
              />
            </div>
            <div className="hidden h-12 min-w-12 items-center justify-center rounded-xl bg-[#f5e6c8] px-3 text-sm font-semibold text-black md:flex">
              {actorName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between border-b border-black/8 px-4 py-4 sm:px-6">
          {isJobOverviewOpen ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsJobOverviewOpen(false);
                  resetDrafts();
                }}
                aria-label="Collapse job overview"
                className="text-3xl leading-none text-black/70"
              >
                ×
              </button>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">
                {selectedJob?.title}
              </h1>
            </div>
          ) : (
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-black/35">Posted roles</p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">Choose a job opening</h1>
            </div>
          )}
          <div className="flex items-center gap-3">
            {shareNotice ? <p className="text-sm text-black/55">{shareNotice}</p> : null}
            {busy ? <p className="text-sm text-black/50">Saving...</p> : null}
          </div>
        </div>

        {isJobOverviewOpen ? (
          <div className="grid xl:grid-cols-[250px_380px_380px_minmax(0,1fr)]">
            <aside className="border-b border-black/8 px-3 py-3 xl:border-b-0 xl:border-r">
              <nav className="space-y-1">
                {stageCounts.map((stage) => {
                  const active = selectedStage === stage.name;

                  return (
                    <button
                      key={stage.name}
                      type="button"
                      onClick={() => handleStageSelect(stage.name)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[18px] transition ${
                        active ? "bg-black/[0.04] text-black" : "text-black/68 hover:bg-black/[0.03]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl text-black/60">{stageIcons[stage.name]}</span>
                        {stage.name}
                      </span>
                      <span className="text-black/45">{stage.count}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 space-y-1">
                {sideLinks.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[18px] text-black/68 transition hover:bg-black/[0.03]"
                  >
                    <span className="text-xl text-black/55">{sideLinkIcons[item]}</span>
                    {item}
                  </button>
                ))}
              </div>

              <Link
                href="/"
                className="mt-10 inline-flex h-12 items-center rounded-full border border-black/10 px-5 text-[17px] text-black/72"
              >
                Back to site
              </Link>
            </aside>

            <section className="border-b border-black/8 px-4 py-4 xl:border-b-0 xl:border-r">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-black">{selectedStage}</h2>
              </div>

              <div className="space-y-1.5">
                {filteredCandidates.length ? (
                  filteredCandidates.map((candidate) => {
                    const active = candidate.id === selectedCandidate?.id;

                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(candidate.id);
                          resetDrafts();
                        }}
                        className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition ${
                          active ? "bg-black/[0.05]" : "hover:bg-black/[0.03]"
                        }`}
                      >
                        <span className="text-2xl text-black/55">◌</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[18px] text-black">{candidate.name}</div>
                          <div className="truncate text-[15px] text-black/42">{candidate.badge}</div>
                        </div>
                        <span className="text-2xl leading-none text-black/40">›</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl px-4 py-6 text-[17px] text-black/45">No candidates in this stage.</div>
                )}
              </div>
            </section>

            <section className="border-b border-black/8 px-4 py-4 xl:border-b-0 xl:border-r">
              {selectedCandidate ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">{selectedCandidate.name}</h2>
                      <div className="mt-3 inline-flex rounded-lg border border-black/10 px-3 py-2 text-[16px] text-black/55">
                        {selectedCandidate.badge}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-1">
                    {candidateTabs.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setSelectedTab(tab);
                          resetDrafts();
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[18px] ${
                          selectedTab === tab ? "bg-black/[0.04] text-black" : "text-black/68 hover:bg-black/[0.03]"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-xl text-black/55">{tabIcons[tab]}</span>
                          {tab}
                        </span>
                        {selectedTab === tab ? <span className="text-2xl leading-none text-black/50">›</span> : null}
                      </button>
                    ))}
                  </div>

                  <div className="mt-14 space-y-8">
                    <div>
                      <h3 className="text-[17px] font-semibold text-black">Contact information</h3>
                      <div className="mt-4 space-y-4 text-[17px] text-black/70">
                        <div className="flex items-center gap-3">
                          <span className="text-xl text-black/55">◔</span>
                          {selectedCandidate.phone}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl text-black/55">✉</span>
                          {selectedCandidate.email}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[17px] font-semibold text-black">Links</h3>
                      <div className="mt-4 space-y-4 text-[17px] text-black/70">
                        <div className="flex items-center gap-3">
                          <span className="text-xl text-black/55">⌘</span>
                          {selectedCandidate.github}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex flex-wrap gap-3">
                    {isDecisionStage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleMoveCandidate("Offer")}
                          className="inline-flex h-14 items-center rounded-xl bg-black px-6 text-[18px] font-medium text-white"
                        >
                          Move to Offer
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMoveCandidate("Declined")}
                          className="inline-flex h-14 items-center rounded-xl bg-black/[0.06] px-6 text-[18px] text-black"
                        >
                          Decline
                        </button>
                      </>
                    ) : upcomingStage ? (
                      <button
                        type="button"
                        onClick={() => void handleMoveCandidate(upcomingStage)}
                        className="inline-flex h-14 items-center rounded-xl bg-black px-6 text-[18px] font-medium text-white"
                      >
                        {formatStageLabel(upcomingStage)}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleArchive()}
                      className="inline-flex h-14 items-center rounded-xl bg-black/[0.06] px-6 text-[18px] text-black"
                    >
                      Archive
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-black/10 p-5 text-[17px] text-black/58">
                  No candidates yet for this role. Applications submitted from the public job page will appear here.
                </div>
              )}
            </section>

            <section className="px-4 py-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">{selectedTab}</h2>
              </div>

              {!selectedCandidate ? null : (
                <>
                  <div className="text-[17px] text-black/50">{selectedCandidate.activity}</div>

                  {selectedTab === "Overview" ? (
                    <>
                      <div className="mt-6 rounded-2xl border border-black/10 p-5">
                        <div className="mb-4 flex items-center gap-3 text-[18px] text-black/55">
                          <span className="text-2xl">◫</span>
                          Application question responses
                        </div>

                        <div className="space-y-10">
                          {selectedCandidate.responses.length ? (
                            selectedCandidate.responses.map((response) => (
                              <div key={response.question}>
                                <h3 className="text-[18px] font-semibold text-black">{response.question}</h3>
                                <p className="mt-3 text-[17px] leading-9 text-black/82">{response.answer}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[17px] text-black/45">No custom responses captured for this application.</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl border border-black/10 p-5">
                        <h3 className="text-[18px] font-semibold text-black">Comments</h3>
                        <div className="mt-4 space-y-4">
                          {selectedCandidate.comments.length ? (
                            selectedCandidate.comments.map((comment, index) => (
                              <div key={`${comment.author}-${index}`} className="rounded-xl bg-black/[0.03] px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-[17px] font-semibold text-black">{comment.author}</p>
                                  <p className="text-[15px] text-black/38">{comment.time}</p>
                                </div>
                                <p className="mt-2 text-[17px] leading-8 text-black/74">{comment.body}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[17px] text-black/45">No comments yet.</p>
                          )}
                        </div>

                        <textarea
                          value={commentDraft}
                          onChange={(event) => setCommentDraft(event.target.value)}
                          placeholder="Add a comment"
                          className="mt-5 min-h-[120px] w-full rounded-xl border border-black/10 px-4 py-3 text-[17px] leading-8 text-black outline-none placeholder:text-black/35"
                        />
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => void handleAddComment()}
                            className="inline-flex h-14 items-center rounded-xl bg-black/[0.06] px-6 text-[18px] text-black"
                          >
                            Add a comment
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl border border-black/10 p-5">
                        <h3 className="text-[18px] font-semibold text-black">Reviews</h3>
                        <div className="mt-4 space-y-4">
                          {selectedCandidate.reviews.length ? (
                            selectedCandidate.reviews.map((review, index) => (
                              <div key={`${review.author}-${index}`} className="rounded-xl bg-black/[0.03] px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <p className="text-[17px] font-semibold text-black">{review.author}</p>
                                    <span className="rounded-full border border-black/10 px-3 py-1 text-[14px] text-black/55">
                                      {review.recommendation}
                                    </span>
                                  </div>
                                  <p className="text-[15px] text-black/38">{review.time}</p>
                                </div>
                                <p className="mt-2 text-[17px] leading-8 text-black/74">{review.body}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[17px] text-black/45">No reviews started.</p>
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          {["Advance", "Hold", "Hire", "Reject"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setReviewRecommendation(option)}
                              className={`inline-flex h-11 items-center rounded-full px-4 text-[16px] ${
                                reviewRecommendation === option ? "bg-black text-white" : "bg-black/[0.05] text-black/70"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewDraft}
                          onChange={(event) => setReviewDraft(event.target.value)}
                          placeholder="Start a review"
                          className="mt-4 min-h-[120px] w-full rounded-xl border border-black/10 px-4 py-3 text-[17px] leading-8 text-black outline-none placeholder:text-black/35"
                        />
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => void handleStartReview()}
                            className="inline-flex h-14 items-center rounded-xl bg-black/[0.06] px-6 text-[18px] text-black"
                          >
                            Start a review
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {selectedTab === "Resume" ? (
                    <div className="mt-6 rounded-2xl border border-black/10 p-5">
                      <div className="space-y-10">
                        {selectedCandidate.resume.map((section) => (
                          <div key={section.heading}>
                            <h3 className="text-[18px] font-semibold text-black">{section.heading}</h3>
                            <div className="mt-4 space-y-3">
                              {section.items.map((item) => (
                                <div key={item} className="rounded-xl bg-black/[0.03] px-4 py-4 text-[17px] leading-8 text-black/76">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selectedTab === "Messages" ? (
                    <div className="mt-6 rounded-2xl border border-black/10 p-5">
                      <div className="space-y-4">
                        {selectedCandidate.messages.length ? (
                          selectedCandidate.messages.map((message, index) => (
                            <div key={`${message.sender}-${index}`} className="rounded-xl bg-black/[0.03] px-4 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[17px] font-semibold text-black">{message.sender}</p>
                                <p className="text-[15px] text-black/38">{message.time}</p>
                              </div>
                              <p className="mt-2 text-[17px] leading-8 text-black/74">{message.body}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[17px] text-black/45">No messages yet.</p>
                        )}
                      </div>
                      <textarea
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        placeholder="Write a message"
                        className="mt-5 min-h-[120px] w-full rounded-xl border border-black/10 px-4 py-3 text-[17px] leading-8 text-black outline-none placeholder:text-black/35"
                      />
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => void handleSendMessage()}
                          className="inline-flex h-14 items-center rounded-xl bg-black/[0.06] px-6 text-[18px] text-black"
                        >
                          Send message
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {selectedTab === "Files" ? (
                    <div className="mt-6 rounded-2xl border border-black/10 p-5">
                      <div className="space-y-3">
                        {selectedCandidate.files.length ? (
                          selectedCandidate.files.map((file) => (
                            <div key={file.name} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-4 py-4">
                              <div className="min-w-0">
                                <p className="truncate text-[17px] font-semibold text-black">{file.name}</p>
                                <p className="mt-1 text-[15px] text-black/42">{file.meta}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[17px] text-black/45">No files available.</p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {selectedTab === "Notes" ? (
                    <div className="mt-6 rounded-2xl border border-black/10 p-5">
                      <h3 className="text-[18px] font-semibold text-black">Private notes</h3>
                      <textarea
                        value={notesDraft}
                        onChange={(event) => setNotesDraft(event.target.value)}
                        className="mt-4 min-h-[320px] w-full rounded-xl border border-black/10 px-4 py-4 text-[17px] leading-8 text-black outline-none"
                      />
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => void handleSaveNotes()}
                          className="inline-flex h-12 items-center rounded-xl bg-black px-5 text-white"
                        >
                          Save notes
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 rounded-2xl border border-black/10 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h3 className="text-[17px] font-semibold text-black">Candidate summary</h3>
                        <p className="mt-3 text-[17px] leading-8 text-black/72">{selectedCandidate.summary}</p>
                      </div>
                      <div>
                        <h3 className="text-[17px] font-semibold text-black">Context</h3>
                        <div className="mt-3 space-y-2 text-[17px] text-black/68">
                          <p>{selectedCandidate.role}</p>
                          <p>{selectedCandidate.location}</p>
                          <p>{selectedCandidate.source}</p>
                          <p>Current stage: {selectedCandidate.stage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        ) : (
          <section className="px-4 py-6 sm:px-6">
            <div className="max-w-3xl">
              <p className="text-[17px] leading-8 text-black/58">
                Select any active job posting to reopen the hiring workspace for that role.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => {
                const isSelected = job.id === selectedJobId;

                return (
                  <article
                    key={job.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => handleJobSelect(job.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleJobSelect(job.id);
                      }
                    }}
                    className={`cursor-pointer rounded-[24px] border px-5 py-5 text-left transition ${
                      isSelected
                        ? "border-black/15 bg-black/[0.04]"
                        : "border-black/8 bg-white hover:border-black/12 hover:bg-black/[0.02]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-black/35">Posted</p>
                        <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-black">{job.title}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleShareJob(job);
                          }}
                          className="rounded-full border border-black/10 px-3 py-1 text-[13px] text-black/58"
                        >
                          Share
                        </button>
                        {isSelected ? (
                          <span className="rounded-full border border-black/10 px-3 py-1 text-[13px] text-black/58">Current</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-3 text-black">
                      <div className="rounded-2xl bg-black/[0.03] px-3 py-3">
                        <p className="text-[13px] text-black/42">Candidates</p>
                        <p className="mt-2 text-[24px] font-semibold tracking-[-0.03em]">{job.candidateCount}</p>
                      </div>
                      <div className="rounded-2xl bg-black/[0.03] px-3 py-3">
                        <p className="text-[13px] text-black/42">Active</p>
                        <p className="mt-2 text-[24px] font-semibold tracking-[-0.03em]">{job.activeCount}</p>
                      </div>
                      <div className="rounded-2xl bg-black/[0.03] px-3 py-3">
                        <p className="text-[13px] text-black/42">Stages</p>
                        <p className="mt-2 text-[24px] font-semibold tracking-[-0.03em]">{job.stageCount}</p>
                      </div>
                    </div>

                    <p className="mt-6 text-[15px] text-black/48">{job.latestActivity}</p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {isCreateJobOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-black">Create a job</h2>
                <button type="button" onClick={() => setIsCreateJobOpen(false)} className="text-2xl text-black/55">
                  ×
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-black/72">Job title</span>
                  <input
                    value={newJobTitle}
                    onChange={(event) => setNewJobTitle(event.target.value)}
                    placeholder="Senior Full Stack Engineer"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-black/72">Employment type</span>
                  <select
                    value={newJobEmploymentType}
                    onChange={(event) =>
                      setNewJobEmploymentType(
                        event.target.value as "full_time" | "part_time" | "contract" | "internship" | "temporary",
                      )
                    }
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  >
                    <option value="full_time">Full time</option>
                    <option value="part_time">Part time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-black/72">Workplace type</span>
                  <select
                    value={newJobWorkplaceType}
                    onChange={(event) => setNewJobWorkplaceType(event.target.value as "remote" | "hybrid" | "onsite")}
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-black/72">Description</span>
                  <textarea
                    value={newJobDescription}
                    onChange={(event) => setNewJobDescription(event.target.value)}
                    className="min-h-[100px] w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-black/72">Requirements</span>
                  <textarea
                    value={newJobRequirements}
                    onChange={(event) => setNewJobRequirements(event.target.value)}
                    className="min-h-[100px] w-full rounded-xl border border-black/10 px-4 py-3 text-[16px] outline-none"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateJobOpen(false)}
                  className="inline-flex h-11 items-center rounded-xl bg-black/[0.06] px-5 text-black"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateJob()}
                  className="inline-flex h-11 items-center rounded-xl bg-black px-5 text-white"
                >
                  {busy ? "Creating..." : "Create job"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function PlatformPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <PlatformContent />
    </Suspense>
  );
}
