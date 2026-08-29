import { apiClient } from "./client";

export interface PipelineRequest {
  title: string;
  campaign_type: string;
  brief: string;
  audience: string;
  languages: string[];
}

export interface PipelineCompliance {
  compliant: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface PipelineResponse {
  title: string;
  campaign_type: string;
  original_content: string;
  translations: Record<string, string>;
  compliance: PipelineCompliance;
  status: string;
}

export async function runPipeline(
  data: PipelineRequest
): Promise<PipelineResponse> {
  const response = await apiClient.post<PipelineResponse>(
    "/pipeline/run",
    data
  );

  return response.data;
}