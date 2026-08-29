import { apiClient } from "./client";

export interface ChatResponse {
  user_id: string;
  query: string;
  language: string;
  answer: string;
  sources: string[];
}

export interface ChatHistoryItem {
  id: string;
  message: string;
  response: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  user_id: string;
  history: ChatHistoryItem[];
}

// GET /chat/
export async function sendChatMessage(
  userId: string,
  query: string,
  language = "en"
): Promise<ChatResponse> {
  const response = await apiClient.get<ChatResponse>("/chat/", {
    params: {
      user_id: userId,
      query,
      language,
    },
  });

  return response.data;
}

// GET /chat/history
export async function fetchChatHistory(
  userId: string
): Promise<ChatHistoryResponse> {
  const response = await apiClient.get<ChatHistoryResponse>(
    "/chat/history",
    {
      params: {
        user_id: userId,
      },
    }
  );

  return response.data;
}

// GET /chat-history/
export async function fetchSavedChatHistory(
  userId: string
): Promise<ChatHistoryResponse> {
  const response = await apiClient.get<ChatHistoryResponse>(
    "/chat-history/",
    {
      params: {
        user_id: userId,
      },
    }
  );

  return response.data;
}