import { apiClient } from "./client";

export interface GenerateContentRequest {
  campaign_type: string;
  brief: string;
  language: string;
  audience: string;
}

export interface GenerateContentResult {
  campaign_type: string;
  language: string;
  audience: string;
  brief: string;
  draft: string;
}

export interface ToneCheckRequest {
  message: string;
  audience: string;
}

export interface ToneCheckResult {
  appropriate: boolean;
  tone: string;
  issues: string[];
  suggestion: string;
}

export async function generateContent(
  data: GenerateContentRequest
): Promise<GenerateContentResult> {
  const response = await apiClient.post<GenerateContentResult>(
    "/generate-content/",
    data
  );

  return response.data;
}

export async function checkTone(
  data: ToneCheckRequest
): Promise<ToneCheckResult> {
  const response = await apiClient.post<ToneCheckResult>(
    "/generate-content/tone-check",
    data
  );

  return response.data;
}