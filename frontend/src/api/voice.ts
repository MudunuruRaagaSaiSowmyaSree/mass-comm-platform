import { apiClient } from "./client";

export interface VoiceProcessResponse {
  session_id: string;
  detected_language: string;
  raw_transcribed_text: string;
  cleaned_text: string;
  tokens: string[];
  response_text: string;
  audio_response_url: string;
  conversation_history_length: number;
}

export async function sendVoiceQuery(
  sessionId: string,
  audioBlob: Blob,
  language: string
): Promise<VoiceProcessResponse> {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("file", audioBlob, "recording.webm");
  formData.append("language", language);

  const res = await apiClient.post<VoiceProcessResponse>(
    "/api/v1/voice-process",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}