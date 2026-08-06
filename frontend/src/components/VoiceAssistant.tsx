import { useRef, useState } from "react";
import { apiClient } from "../api/client";
import { sendVoiceQuery, type VoiceProcessResponse } from "../api/voice";

const SESSION_ID =
  sessionStorage.getItem("voice_session_id") ??
  (() => {
    const id = crypto.randomUUID();
    sessionStorage.setItem("voice_session_id", id);
    return id;
  })();

const BACKEND_ORIGIN = apiClient.defaults.baseURL as string;

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "en", label: "English" },
];

function Icon({ path, className = "w-5 h-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const paths = {
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3m-3 0h6",
  stop: "M6 6h12v12H6z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2 0 4-4 4-9s-1.8-9-4-9-4 4-4 9 1.8 9 4 9ZM3.6 9h16.8M3.6 15h16.8",
  chevronDown: "M6 9l6 6 6-6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  alert: "M12 9v4m0 4h.01M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
};

export default function VoiceAssistant() {
  const [language, setLanguage] = useState("auto");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceProcessResponse | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBusy(true);
        try {
          const data = await sendVoiceQuery(SESSION_ID, blob, language);
          setResult(data);
        } catch (err) {
          console.error(err);
          setError("Failed to process voice query. Is the backend running?");
        } finally {
          setBusy(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError("Microphone permission denied or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  const LANGUAGE_LABEL: Record<string, string> = {
    hi: "Hindi",
    te: "Telugu",
    bn: "Bengali",
    en: "English",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header card */}
        <div className="rounded-3xl border-l-8 border-[#6C5CE7] bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C6CF0] to-[#5A3FD6] shadow-md">
              <Icon path={paths.mic} className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
                Rural Multilingual Assistant
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Speak in Hindi, Telugu, Bengali, or English &mdash; I&apos;ll reply in the same language.
              </p>
            </div>
          </div>
        </div>

        {/* Controls card */}
        <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">
            Language
          </label>
          <div className="relative mb-6">
            <Icon path={paths.globe} className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={recording || busy}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-9 text-sm outline-none transition focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 disabled:opacity-60"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Icon path={paths.chevronDown} className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Record button with pulse animation while recording */}
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={busy}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition disabled:opacity-50 ${
                recording ? "bg-rose-600 shadow-rose-300" : "bg-gradient-to-br from-[#7C6CF0] to-[#5A3FD6] shadow-[#6C5CE7]/40"
              }`}
            >
              {recording && (
                <span className="absolute inset-0 animate-ping rounded-full bg-rose-500 opacity-40" />
              )}
              <Icon path={recording ? paths.stop : paths.mic} className="relative h-8 w-8" />
            </button>
            <p className="text-sm font-medium text-slate-600">
              {recording ? "Recording… tap to stop" : busy ? "Processing your query…" : "Tap to start recording"}
            </p>
          </div>

          {error && (
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-600">
              <Icon path={paths.alert} className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Conversation result */}
        {result && (
          <div className="space-y-3 rounded-3xl border border-blue-100 bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-blue-50 pb-4">
              <h2 className="text-lg font-bold text-slate-950">Conversation</h2>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-800">
                {LANGUAGE_LABEL[result.detected_language] ?? result.detected_language}
              </span>
            </div>

            {/* User turn */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#6C5CE7] px-4 py-2.5 text-sm text-white">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  <Icon path={paths.user} className="h-3.5 w-3.5" /> You
                </div>
                {result.cleaned_text || "(no speech detected)"}
              </div>
            </div>

            {/* Assistant turn */}
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <Icon path={paths.sparkle} className="h-3.5 w-3.5" /> Assistant
                </div>
                {result.response_text}
              </div>
            </div>

            <audio
              controls
              src={`${BACKEND_ORIGIN}${result.audio_response_url}`}
              className="mt-2 w-full"
            />

            <p className="pt-1 text-right text-xs text-slate-400">
              Turns remembered this session: {result.conversation_history_length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}