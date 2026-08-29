import { apiClient } from "./client";

export interface TranslationRequest {
  source_language: string;
  content: string;
  target_languages: string[];
}

export interface TranslationResponse {
  source_language: string;
  original_content: string;
  translations: Record<string, string>;
}

export async function translateContent(
  data: TranslationRequest
): Promise<TranslationResponse> {
  const response = await apiClient.post<TranslationResponse>(
    "/translations/",
    data
  );

  return response.data;
}