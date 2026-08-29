import { useEffect, useState } from "react";
import {
  fetchChatHistory,
  type ChatHistoryItem,
} from "../api/chat";

export default function ChatHistory({
  userId,
}: {
  userId: string | null;
}) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    if (!userId) {
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchChatHistory(userId);
      setHistory(response.history);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Could not load chat history"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [userId]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
      <h1 className="text-[22px] font-bold text-slate-900">
        Chat History
      </h1>

      <p className="mt-1 text-[13px] text-slate-500">
        View your previous conversations.
      </p>

      {!userId && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[13px] text-slate-500">
            Please log in to view your chat history.
          </p>
        </div>
      )}

      {loading && (
        <p className="mt-5 text-[13px] text-slate-500">
          Loading chat history…
        </p>
      )}

      {error && (
        <p className="mt-5 text-[13px] text-rose-500">
          {error}
        </p>
      )}

      {!loading && !error && userId && history.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-[13px] text-slate-500">
            No chat history yet.
          </p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="mt-5 space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11.5px] text-slate-400">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  You
                </p>

                <p className="mt-1 whitespace-pre-wrap text-[13.5px] text-slate-800">
                  {item.message}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Assistant
                </p>

                <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-700">
                  {item.response}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}