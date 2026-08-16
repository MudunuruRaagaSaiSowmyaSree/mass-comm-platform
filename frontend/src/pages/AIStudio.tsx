import { useState } from "react";
import { Icon, icons } from "../components/Icon";
import { generateContent, checkTone, type GenerateContentResult, type ToneCheckResult } from "../api/content";

const CAMPAIGN_TYPES = ["awareness", "emergency", "educational", "announcement"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "Telugu" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
];

export default function AIStudio() {
  const [campaignType, setCampaignType] = useState(CAMPAIGN_TYPES[0]);
  const [brief, setBrief] = useState("");
  const [language, setLanguage] = useState("en");
  const [audience, setAudience] = useState("general_public");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateContentResult | null>(null);

  const [toneMessage, setToneMessage] = useState("");
  const [toneChecking, setToneChecking] = useState(false);
  const [toneError, setToneError] = useState<string | null>(null);
  const [toneResult, setToneResult] = useState<ToneCheckResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    try {
      const res = await generateContent({ campaign_type: campaignType, brief, language, audience });
      setResult(res);
      setToneMessage(res.draft);
    } catch (err: any) {
      setGenError(err?.response?.data?.detail ?? "Content generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToneCheck(e: React.FormEvent) {
    e.preventDefault();
    setToneChecking(true);
    setToneError(null);
    try {
      const res = await checkTone({ message: toneMessage, audience });
      setToneResult(res);
    } catch (err: any) {
      setToneError(err?.response?.data?.detail ?? "Tone check failed");
    } finally {
      setToneChecking(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
      <h1 className="text-[22px] font-bold text-slate-900">AI Content Studio</h1>
      <p className="mt-1 text-[13px] text-slate-500">Generate campaign drafts and check tone before you publish.</p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
            <Icon path={icons.sparkle} className="h-4 w-4 text-[#6C5CE7]" />
            Generate Draft
          </p>
          <form onSubmit={handleGenerate} className="mt-4 space-y-3">
            <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]">
              {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea
              required
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe what this campaign should say…"
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />
            <div className="grid grid-cols-2 gap-3">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Audience"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
              />
            </div>
            {genError && <p className="text-[12.5px] text-rose-500">{genError}</p>}
            <button
              type="submit"
              disabled={generating}
              className="w-full rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {generating ? "Generating…" : "Generate Draft"}
            </button>
          </form>
          {result && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">Draft</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-700">{result.draft}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">Tone Check</p>
          <p className="text-[11.5px] text-slate-500">Paste a message (or use a generated draft) to check its tone.</p>
          <form onSubmit={handleToneCheck} className="mt-4 space-y-3">
            <textarea
              required
              value={toneMessage}
              onChange={(e) => setToneMessage(e.target.value)}
              rows={5}
              placeholder="Message to check…"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />
            {toneError && <p className="text-[12.5px] text-rose-500">{toneError}</p>}
            <button
              type="submit"
              disabled={toneChecking}
              className="w-full rounded-xl border border-[#6C5CE7] py-2.5 text-[13.5px] font-semibold text-[#5A3FD6] disabled:opacity-60"
            >
              {toneChecking ? "Checking…" : "Check Tone"}
            </button>
          </form>
          {toneResult && (
            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneResult.appropriate ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {toneResult.appropriate ? "Appropriate" : "Needs adjustment"}
                </span>
                <span className="text-[11.5px] capitalize text-slate-500">Tone: {toneResult.tone}</span>
              </div>
              {toneResult.issues.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-[12.5px] text-slate-600">
                  {toneResult.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              )}
              {toneResult.suggestion && <p className="text-[12.5px] text-slate-600">{toneResult.suggestion}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}