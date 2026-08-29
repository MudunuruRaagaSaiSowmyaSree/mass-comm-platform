import { apiClient } from "./client";

export interface CampaignReport {
  total: number;
  completed: number;
  scheduled: number;
  sending: number;
  failed: number;
}

export interface RecipientReport {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
}

export interface MessageReport {
  total: number;
  delivered: number;
  pending: number;
  failed: number;
}

export interface ReportsSummary {
  campaigns: CampaignReport;
  recipients: RecipientReport;
  messages: MessageReport;
  delivery_rate: number;
  failure_rate: number;
}

// GET /reports/summary
export async function fetchReportsSummary(): Promise<ReportsSummary> {
  const response = await apiClient.get<ReportsSummary>(
    "/reports/summary"
  );

  return response.data;
}