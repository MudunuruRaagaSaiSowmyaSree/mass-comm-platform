import { useState } from "react";
import { runPipeline, type PipelineResponse } from "../api/pipeline";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "Telugu" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
];

export default function Pipeline() {
  const [title, setTitle] = useState("");
  const [campaignType, setCampaignType] = useState("awareness");
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState("general public");

  const [languages, setLanguages] = useState<string[]>([
    "en",
    "te",
    "hi",
    "bn",
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResponse | null>(null);

  function toggleLanguage(code: string) {
    setLanguages((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  }

  function sendToReview(response: PipelineResponse) {
    localStorage.setItem(
      "review_draft",
      response.original_content
    );

    localStorage.setItem(
      "review_status",
      response.status
    );

    localStorage.setItem(
      "review_title",
      response.title
    );

    localStorage.setItem(
      "review_compliance",
      JSON.stringify(response.compliance)
    );

    window.dispatchEvent(
      new Event("review-draft-updated")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setResult(null);

    if (!title.trim()) {
      setError("Please enter a campaign title.");
      return;
    }

    if (!brief.trim()) {
      setError("Please enter a campaign brief.");
      return;
    }

    if (languages.length === 0) {
      setError("Please select at least one language.");
      return;
    }

    setLoading(true);

    try {
      const response = await runPipeline({
        title: title.trim(),
        campaign_type: campaignType,
        brief: brief.trim(),
        audience: audience.trim() || "general public",
        languages,
      });

      setResult(response);

      // Automatically make the generated content
      // available to the Review page.
      sendToReview(response);
    } catch (err: any) {
      console.error("Pipeline failed:", err);

      const detail = err?.response?.data?.detail;

      if (err?.response?.status === 401) {
        setError(
          "You are not authenticated. Please log in again."
        );
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(
          "Pipeline failed. Please make sure the backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function openReview() {
    if (!result) {
      return;
    }

    sendToReview(result);

    window.dispatchEvent(
      new CustomEvent("navigate-view", {
        detail: "review",
      })
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
      <h1 className="text-[22px] font-bold text-slate-900">
        Campaign Pipeline
      </h1>

      <p className="mt-1 text-[13px] text-slate-500">
        Generate content, translate it, check compliance,
        and determine whether the campaign is ready.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ================================================= */}
        {/* CAMPAIGN FORM                                    */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-[15px] font-semibold text-slate-900">
            Campaign Details
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-4 space-y-3"
          >
            <input
              required
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Campaign title"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-[#6C5CE7]"
            />

            <select
              value={campaignType}
              onChange={(e) =>
                setCampaignType(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-[#6C5CE7]"
            >
              <option value="awareness">
                Awareness
              </option>

              <option value="emergency">
                Emergency
              </option>

              <option value="educational">
                Educational
              </option>

              <option value="announcement">
                Announcement
              </option>
            </select>

            <textarea
              required
              value={brief}
              onChange={(e) =>
                setBrief(e.target.value)
              }
              placeholder="Describe the campaign..."
              rows={6}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-[#6C5CE7]"
            />

            <input
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value)
              }
              placeholder="Target audience"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-[#6C5CE7]"
            />

            <div>
              <p className="mb-2 text-[12px] font-semibold text-slate-700">
                Languages
              </p>

              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((language) => (
                  <label
                    key={language.code}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[12px]"
                  >
                    <input
                      type="checkbox"
                      checked={languages.includes(
                        language.code
                      )}
                      onChange={() =>
                        toggleLanguage(
                          language.code
                        )
                      }
                    />

                    {language.label}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {loading
                ? "Running Pipeline..."
                : "Run Campaign Pipeline"}
            </button>
          </form>
        </div>

        {/* ================================================= */}
        {/* RESULT                                           */}
        {/* ================================================= */}

        <div className="space-y-5 lg:col-span-2">

          {!result && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-slate-600">
                No pipeline result yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Enter campaign details and run the pipeline.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* STATUS */}

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Campaign
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {result.title}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                      result.status === "ready"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {result.status === "ready"
                      ? "Ready"
                      : "Review Required"}
                  </span>
                </div>

                {/* SEND TO REVIEW */}

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={openReview}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Open in Content Review
                  </button>

                  <p className="mt-2 text-[11px] text-slate-400">
                    The generated campaign message has been
                    saved and is ready for review.
                  </p>
                </div>
              </div>

              {/* COMPLIANCE */}

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  Compliance
                </h2>

                <div className="mt-4 flex items-center gap-5">
                  <div>
                    <p className="text-3xl font-bold text-slate-900">
                      {result.compliance.score}
                    </p>

                    <p className="text-xs text-slate-400">
                      Score / 100
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      result.compliance.compliant
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {result.compliance.compliant
                      ? "Compliant"
                      : "Not Compliant"}
                  </span>
                </div>

                {result.compliance.issues.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-rose-600">
                      Issues
                    </p>

                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      {result.compliance.issues.map(
                        (issue, index) => (
                          <li key={index}>
                            {issue}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {result.compliance.suggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-indigo-600">
                      Suggestions
                    </p>

                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      {result.compliance.suggestions.map(
                        (suggestion, index) => (
                          <li key={index}>
                            {suggestion}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* GENERATED CONTENT */}

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  Generated Content
                </h2>

                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                  {result.original_content}
                </p>
              </div>

              {/* TRANSLATIONS */}

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  Translations
                </h2>

                <div className="mt-4 space-y-4">
                  {Object.entries(
                    result.translations
                  ).map(([code, text]) => (
                    <div
                      key={code}
                      className="rounded-xl bg-slate-50 p-4"
                    >
                      <p className="text-xs font-bold uppercase text-indigo-600">
                        {LANGUAGES.find(
                          (language) =>
                            language.code === code
                        )?.label ?? code}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}