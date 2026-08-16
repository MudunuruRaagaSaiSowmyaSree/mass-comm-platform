import { useState } from "react";
import { sendChatMessage } from "../api/chat";

interface ChatProps {
  userId: string | null;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "te", label: "Telugu" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
];

export default function Chat({ userId }: ChatProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("en");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!userId) {
      setError("Please log in again.");
      return;
    }

    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await sendChatMessage(
        userId,
        query.trim(),
        language
      );

      setAnswer(response.answer);
      setSources(response.sources ?? []);
      setQuery("");
    } catch (err: any) {
      console.error("Chat error:", err);

      setError(
        err?.response?.data?.detail ??
          "Unable to get a response from the AI assistant."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-[22px] font-bold text-slate-900">
          AI Chat Assistant
        </h1>

        <p className="mt-1 text-[13px] text-slate-500">
          Ask questions and get AI-powered answers from your knowledge base.
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-4xl">
          {!answer && !loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE9FE] text-2xl">
                ✨
              </div>

              <h2 className="mt-4 text-[18px] font-semibold text-slate-900">
                How can I help you?
              </h2>

              <p className="mt-2 text-[13px] text-slate-500">
                Ask something about your campaign, audience, templates,
                communication strategy, or available information.
              </p>
            </div>
          )}

          {/* User question */}
          {answer && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <div className="max-w-2xl rounded-2xl rounded-br-md bg-[#5A3FD6] px-5 py-3.5 text-[13.5px] text-white shadow-sm">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    You
                  </p>

                  <p className="whitespace-pre-wrap">
                    Previous question
                  </p>
                </div>
              </div>

              {/* Assistant response */}
              <div className="flex justify-start">
                <div className="max-w-3xl rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#5A3FD6]">
                    AI Assistant
                  </p>

                  <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-slate-700">
                    {answer}
                  </p>

                  {sources.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Sources
                      </p>

                      <div className="mt-2 space-y-1">
                        {sources.map((source, index) => (
                          <p
                            key={index}
                            className="text-[11.5px] text-slate-500"
                          >
                            • {source}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[13px] text-slate-500">
                AI Assistant is thinking…
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-[13px] text-rose-600">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-8 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex items-center gap-2">
            <label className="text-[12px] font-semibold text-slate-600">
              Response language
            </label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-700 outline-none focus:ring-2 focus:ring-[#5A3FD6]"
            >
              {LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI assistant..."
              rows={2}
              className="flex-1 resize-none bg-transparent px-2 py-1 text-[13.5px] text-slate-800 outline-none placeholder:text-slate-400"
            />

            <button
              onClick={handleSend}
              disabled={loading || !query.trim() || !userId}
              className="rounded-xl bg-[#5A3FD6] px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-[#4C32C2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>

          <p className="mt-2 text-[10.5px] text-slate-400">
            Press Enter to send. Use Shift + Enter for a new line.
          </p>
        </div>
      </div>
    </div>
  );
}