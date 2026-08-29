import { apiClient } from "./client";

export interface ComplianceRequest {
  language: string;
  message: string;
}

export interface ComplianceResult {
  compliant: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  message: string;
}

export async function checkCompliance(
  data: ComplianceRequest
): Promise<ComplianceResult> {
  const response = await apiClient.post<ComplianceResult>(
    "/compliance/check",
    data
  );

  return response.data;
}