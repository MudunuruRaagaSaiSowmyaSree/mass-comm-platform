import { useState } from "react";
import {
  translateContent,
  type TranslationResponse,
} from "../api/translations";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "Telugu" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
];

export default function Translations() {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [content, setContent] = useState("");
  const [targetLanguages, setTargetLanguages] = useState<string[]>([
    "te",
  ]);

  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResponse | null>(null);

  function handleTargetLanguageChange(code: string) {
    setTargetLanguages((current) => {
      if (current.includes(code)) {
        return current.filter((language) => language !== code);
      }

      return [...current, code];
    });
  }

  async function handleTranslate(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Please enter content to translate.");
      return;
    }

    if (targetLanguages.length === 0) {
      setError("Please select at least one target language.");
      return;
    }

    setTranslating(true);
    setError(null);
    setResult(null);

    try {
      const response = await translateContent({
        source_language: sourceLanguage,
        content: content.trim(),
        target_languages: targetLanguages,
      });

      setResult(response);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Translation failed. Please try again."
      );
    } finally {
      setTranslating(false);
    }
  }

  function getLanguageLabel(code: string) {
    return (
      LANGUAGES.find((language) => language.code === code)?.label ??
      code
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
      <h1 className="text-[22px] font-bold text-slate-900">
        Translations
      </h1>

      <p className="mt-1 text-[13px] text-slate-500">
        Translate public communication content into multiple languages.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* TRANSLATION FORM */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">
            Translate Content
          </p>

          <form
            onSubmit={handleTranslate}
            className="mt-4 space-y-4"
          >
            {/* SOURCE LANGUAGE */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-slate-600">
                Source Language
              </label>

              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
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
            </div>

            {/* CONTENT */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-slate-600">
                Content
              </label>

              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the content you want to translate..."
                rows={7}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
              />
            </div>

            {/* TARGET LANGUAGES */}
            <div>
              <label className="mb-2 block text-[12px] font-medium text-slate-600">
                Target Languages
              </label>

              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((language) => (
                  <label
                    key={language.code}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] hover:border-[#6C5CE7]"
                  >
                    <input
                      type="checkbox"
                      checked={targetLanguages.includes(
                        language.code
                      )}
                      onChange={() =>
                        handleTargetLanguageChange(
                          language.code
                        )
                      }
                      className="h-4 w-4 accent-[#6C5CE7]"
                    />

                    <span>{language.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <p className="text-[12.5px] text-rose-500">
                {error}
              </p>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={translating}
              className="w-full rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {translating
                ? "Translating..."
                : "Translate Content"}
            </button>
          </form>
        </div>

        {/* RESULTS */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">
            Translation Results
          </p>

          {!result && (
            <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center">
              <p className="text-[13px] text-slate-500">
                Your translations will appear here.
              </p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              {/* ORIGINAL CONTENT */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Original Content
                </p>

                <p className="mt-2 whitespace-pre-wrap text-[13px] text-slate-700">
                  {result.original_content}
                </p>

                <p className="mt-2 text-[11.5px] text-slate-400">
                  Source:{" "}
                  {getLanguageLabel(result.source_language)}
                </p>
              </div>

              {/* TRANSLATIONS */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Translations
                </p>

                <div className="space-y-3">
                  {Object.entries(result.translations).map(
                    ([language, text]) => (
                      <div
                        key={language}
                        className="rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-[#EDE9FE] px-2.5 py-1 text-[11px] font-semibold text-[#5A3FD6]">
                            {getLanguageLabel(language)}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {language.toUpperCase()}
                          </span>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-[13px] text-slate-700">
                          {String(text)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}