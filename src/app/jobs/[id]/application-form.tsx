"use client";

import { type FormEvent, useState } from "react";

type ApplicationFormProps = {
  jobId: string;
};

type Notice = {
  kind: "idle" | "success" | "error";
  message: string;
};

const DEFAULT_SUCCESS_MESSAGE = "Application submitted successfully. We will review your profile and get back to you soon.";

export function ApplicationForm({ jobId }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>({ kind: "idle", message: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setNotice({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });

      let payload: { success?: boolean; message?: string } | null = null;

      try {
        payload = (await response.json()) as { success?: boolean; message?: string };
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Could not submit your application. Please try again.");
      }

      setNotice({ kind: "success", message: payload.message || DEFAULT_SUCCESS_MESSAGE });
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not submit your application. Please try again.";
      setNotice({ kind: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      <input type="hidden" name="jobId" value={jobId} />

      {notice.kind !== "idle" ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-md border px-4 py-3 text-sm ${
            notice.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="firstName"
              id="firstName"
              required
              className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="lastName"
              id="lastName"
              required
              className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            type="email"
            name="email"
            id="email"
            required
            className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone number
        </label>
        <div className="mt-1">
          <input
            type="tel"
            name="phone"
            id="phone"
            className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
          Resume/CV Link (e.g. LinkedIn, Portfolio, Drive)
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="resume"
            id="resume"
            required
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="linkedin.com/in/your-name or https://..."
          />
        </div>
      </div>

      <div>
        <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
          Cover Letter (Optional)
        </label>
        <div className="mt-1">
          <textarea
            id="coverLetter"
            name="coverLetter"
            rows={4}
            className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
