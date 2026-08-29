import { apiClient } from "./client";

/* ============================================================
   CHANNEL ANALYTICS
   ============================================================ */

export interface ChannelAnalytics {
  channel: string;

  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;

  delivery_rate: number;
}

/* ============================================================
   GLOBAL ANALYTICS
   GET /analytics/summary
   ============================================================ */

export interface AnalyticsSummary {
  total_campaigns: number;
  total_recipients: number;
  total_deliveries: number;

  pending: number;
  sent: number;
  delivered: number;
  failed: number;

  delivery_rate: number;
  failure_rate: number;

  opens: number;
  clicks: number;
  responses: number;
  participation: number;

  open_rate: number;
  click_through_rate: number;
  response_rate: number;
  participation_rate: number;
}

/* ============================================================
   CAMPAIGN ANALYTICS
   GET /analytics/campaign/{campaign_id}
   ============================================================ */

export interface CampaignAnalytics {
  campaign_id: string;
  campaign_status: string;

  total_recipients: number;
  total_deliveries: number;

  pending: number;
  sent: number;
  delivered: number;
  failed: number;

  delivery_rate: number;
  failure_rate: number;

  opens: number;
  clicks: number;
  responses: number;
  participation: number;

  open_rate: number;
  click_through_rate: number;
  response_rate: number;
  participation_rate: number;

  started_at: string | null;
  completed_at: string | null;

  channels: ChannelAnalytics[];
}

/* ============================================================
   GET GLOBAL ANALYTICS
   ============================================================ */

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await apiClient.get<AnalyticsSummary>(
    "/analytics/summary"
  );

  return response.data;
}

/* ============================================================
   GET CAMPAIGN ANALYTICS
   ============================================================ */

export async function fetchCampaignAnalytics(
  campaignId: string
): Promise<CampaignAnalytics> {
  const response = await apiClient.get<CampaignAnalytics>(
    `/analytics/campaign/${campaignId}`
  );

  return response.data;
}
