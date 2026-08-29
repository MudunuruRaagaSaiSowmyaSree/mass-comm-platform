import { useState } from "react";
import {
  checkCompliance,
  type ComplianceResult,
} from "../api/compliance";

export default function Compliance() {
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("en");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message to check.");
      return;
    }

    setChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkCompliance({
        language,
        message: message.trim(),
      });

      setResult(response);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Compliance check failed"
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
      <h1 className="text-[22px] font-bold text-slate-900">
        Compliance
      </h1>

      <p className="mt-1 text-[13px] text-slate-500">
        Check whether your public communication is suitable
        before publishing.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CHECK FORM */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">
            Compliance Check
          </p>

          <form
            onSubmit={handleCheck}
            className="mt-4 space-y-3"
          >
            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            >
              <option value="en">English</option>
              <option value="te">Telugu</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
            </select>

            <textarea
              required
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Enter the public communication message..."
              rows={8}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />

            {error && (
              <p className="text-[12.5px] text-rose-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={checking}
              className="w-full rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {checking
                ? "Checking..."
                : "Check Compliance"}
            </button>
          </form>
        </div>

        {/* RESULT */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">
            Compliance Result
          </p>

          {!result && (
            <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center">
              <p className="text-[13px] text-slate-500">
                Your compliance result will appear here.
              </p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              {/* SCORE */}
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-600">
                    Compliance Score
                  </span>

                  <span className="text-[20px] font-bold text-slate-900">
                    {result.score}/100
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#6C5CE7]"
                    style={{
                      width: `${Math.min(
                        Math.max(result.score, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* STATUS */}
              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11.5px] font-semibold ${
                    result.compliant
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {result.compliant
                    ? "Compliant"
                    : "Not Compliant"}
                </span>
              </div>

              {/* MESSAGE */}
              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Summary
                </p>

                <p className="mt-1 text-[13px] text-slate-700">
                  {result.message}
                </p>
              </div>

              {/* ISSUES */}
              {result.issues.length > 0 && (
                <div className="rounded-xl bg-rose-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                    Issues
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] text-slate-700">
                    {result.issues.map(
                      (issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* SUGGESTIONS */}
              {result.suggestions.length > 0 && (
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                    Suggestions
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] text-slate-700">
                    {result.suggestions.map(
                      (suggestion: string, index: number) => (
                        <li key={index}>
                          {suggestion}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}