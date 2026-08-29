import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

type ReviewAction =
  | "approve"
  | "reject"
  | "edit";

interface ReviewResponse {
  status: string;
  message: string;
  final_message: string | null;
  reviewer_comment: string | null;
}

interface TranslationResponse {
  source_language: string;
  target_language: string;
  original_message: string;
  translated_message: string;
  fallback: boolean;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "Telugu" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
];

const DEFAULT_DRAFT = `A cleaner neighborhood starts with all of us!

Keeping our streets, parks, and public spaces free of litter helps protect our environment and keeps our communities healthy.

Here is how you can help:
- Always throw your trash in the proper bins.
- Pick up litter when you see it.
- Recycle whenever possible.

Small everyday habits make a big difference. Let's work together to keep our community clean and green!`;

export default function Review() {
  const [draft, setDraft] =
    useState(DEFAULT_DRAFT);

  const [reviewerComment, setReviewerComment] =
    useState("");

  const [status, setStatus] =
    useState<string>("draft");

  const [loadingAction, setLoadingAction] =
    useState<ReviewAction | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [targetLanguage, setTargetLanguage] =
    useState("te");

  const [translatedMessage, setTranslatedMessage] =
    useState("");

  const [translationLoading, setTranslationLoading] =
    useState(false);

  /* ====================================================== */
  /* LOAD PIPELINE DRAFT                                    */
  /* ====================================================== */

  function loadPipelineDraft() {
    const savedDraft =
      localStorage.getItem("review_draft");

    const savedStatus =
      localStorage.getItem("review_status");

    if (savedDraft) {
      setDraft(savedDraft);
      setSuccess(
        "Pipeline-generated content loaded into Review."
      );
    }

    if (savedStatus) {
      setStatus("draft");
    }
  }

  useEffect(() => {
    loadPipelineDraft();

    window.addEventListener(
      "review-draft-updated",
      loadPipelineDraft
    );

    return () => {
      window.removeEventListener(
        "review-draft-updated",
        loadPipelineDraft
      );
    };
  }, []);

  /* ====================================================== */
  /* REVIEW ACTION                                         */
  /* ====================================================== */

  async function submitReview(
    action: ReviewAction
  ) {
    setError(null);
    setSuccess(null);

    if (!draft.trim()) {
      setError(
        "The draft message cannot be empty."
      );
      return;
    }

    setLoadingAction(action);

    try {
      const response =
        await apiClient.post<ReviewResponse>(
          "/review/",
          {
            action,
            draft,
            edited_message:
              action === "edit"
                ? draft
                : null,
            reviewer_comment:
              reviewerComment.trim() || null,
          }
        );

      setStatus(response.data.status);

      if (response.data.final_message) {
        setDraft(
          response.data.final_message
        );
      }

      setSuccess(
        response.data.message
      );
    } catch (err: any) {
      console.error(
        "Review action failed:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(
          "Unable to process the review. Please make sure the backend is running."
        );
      }
    } finally {
      setLoadingAction(null);
    }
  }

  /* ====================================================== */
  /* TRANSLATION                                            */
  /* ====================================================== */

  async function translateMessage() {
    setError(null);
    setSuccess(null);

    if (!draft.trim()) {
      setError(
        "Please enter a message before translating."
      );
      return;
    }

    if (targetLanguage === "en") {
      setTranslatedMessage(draft);
      return;
    }

    setTranslationLoading(true);

    try {
      const response =
        await apiClient.post<TranslationResponse>(
          "/review/translate",
          {
            message: draft,
            source_language: "en",
            target_language: targetLanguage,
          }
        );

      setTranslatedMessage(
        response.data.translated_message
      );

      setSuccess(
        `Translation to ${
          LANGUAGES.find(
            (language) =>
              language.code === targetLanguage
          )?.label ?? targetLanguage
        } completed successfully.`
      );
    } catch (err: any) {
      console.error(
        "Translation failed:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(
          "Translation failed. Please try again."
        );
      }
    } finally {
      setTranslationLoading(false);
    }
  }

  /* ====================================================== */
  /* STATUS STYLING                                         */
  /* ====================================================== */

  function getStatusClasses() {
    if (status === "approved") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "rejected") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }

    if (status === "edited") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return (
  <div className="flex-1 overflow-y-auto bg-slate-50 p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* HEADER */}

        <div className="rounded-3xl border-l-8 border-indigo-600 bg-white p-8 shadow-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">
                Content Review
              </h1>

              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Review, edit, approve, or reject
                AI-generated communication content
                before deployment.
              </p>
            </div>

            <div
              className={`rounded-full border px-5 py-2.5 text-sm font-bold uppercase ${getStatusClasses()}`}
            >
              Status: {status}
            </div>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {/* MAIN */}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* DRAFT */}

          <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl lg:col-span-2">

            <div className="mb-6 border-b border-indigo-50 pb-5">
              <h2 className="text-2xl font-bold text-slate-950">
                AI Generated Draft
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Communication team can edit the
                generated content before approval.
              </p>
            </div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-900">
              Message
            </label>

            <textarea
              value={draft}
              onChange={(e) =>
                setDraft(e.target.value)
              }
              rows={15}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter or edit the AI-generated message..."
            />

            {/* COMMENT */}

            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-900">
                Reviewer Comment
              </label>

              <textarea
                value={reviewerComment}
                onChange={(e) =>
                  setReviewerComment(
                    e.target.value
                  )
                }
                rows={4}
                className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional comment about this review..."
              />
            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  submitReview("edit")
                }
                disabled={
                  loadingAction !== null
                }
                className="rounded-xl border border-amber-300 bg-amber-100 px-6 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAction === "edit"
                  ? "Saving..."
                  : "Save Edit"}
              </button>

              <button
                type="button"
                onClick={() =>
                  submitReview("approve")
                }
                disabled={
                  loadingAction !== null
                }
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAction === "approve"
                  ? "Approving..."
                  : "Approve"}
              </button>

              <button
                type="button"
                onClick={() =>
                  submitReview("reject")
                }
                disabled={
                  loadingAction !== null
                }
                className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAction === "reject"
                  ? "Rejecting..."
                  : "Reject"}
              </button>
            </div>
          </div>

          {/* TRANSLATION */}

          <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl">

            <div className="mb-6 border-b border-blue-50 pb-5">
              <h2 className="text-2xl font-bold text-slate-950">
                Translation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Translate the reviewed message into
                supported Indian languages.
              </p>
            </div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-blue-900">
              Target Language
            </label>

            <select
              value={targetLanguage}
              onChange={(e) =>
                setTargetLanguage(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LANGUAGES.map((language) => (
                <option
                  key={language.code}
                  value={language.code}
                >
                  {language.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={translateMessage}
              disabled={translationLoading}
              className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {translationLoading
                ? "Translating..."
                : "Translate"}
            </button>

            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-blue-900">
                Translation Result
              </label>

              <textarea
                value={translatedMessage}
                readOnly
                rows={12}
                className="w-full resize-y rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm leading-7 text-slate-800 outline-none"
                placeholder="Translation will appear here..."
              />
            </div>
          </div>
        </div>

        {/* WORKFLOW */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-950">
            Review Workflow
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">

            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm font-bold text-indigo-700">
                1
              </div>

              <p className="mt-2 font-semibold">
                Generate
              </p>

              <p className="mt-1 text-xs text-slate-500">
                AI creates the initial campaign
                message.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm font-bold text-indigo-700">
                2
              </div>

              <p className="mt-2 font-semibold">
                Review
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Communication team checks and edits
                the draft.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm font-bold text-indigo-700">
                3
              </div>

              <p className="mt-2 font-semibold">
                Approve
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Reviewer approves or rejects the
                communication.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm font-bold text-indigo-700">
                4
              </div>

              <p className="mt-2 font-semibold">
                Translate
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Approved content can be translated
                into supported languages.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}