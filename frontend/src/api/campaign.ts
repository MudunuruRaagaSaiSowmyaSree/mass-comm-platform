import { apiClient } from "./client";

export type CampaignType =
  | "awareness"
  | "emergency"
  | "educational"
  | "announcement";

export type CampaignStatus =
  | "draft"
  | "review"
  | "ready"
  | "scheduled"
  | "sending"
  | "completed"
  | "failed";

export interface Campaign {
  id: string;
  title: string;
  content: string;
  type: CampaignType;
  status: CampaignStatus;

  created_by?: string;

  target_filters: Record<string, string> | null;

  channels: string[];

  template_id: string | null;

  created_at?: string;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string;
}

export interface CreateCampaignPayload {
  title: string;
  content: string;
  type: CampaignType;

  target_filters?: Record<string, string>;

  channels?: string[];

  template_id?: string | null;

  scheduled_at?: string | null;
}

export interface CampaignTransitionPayload {
  new_status: CampaignStatus;
}

// ============================================================
// GET /campaigns/
// ============================================================

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await apiClient.get<Campaign[]>("/campaigns/");
  return res.data;
}

// ============================================================
// GET /campaigns/{id}
// ============================================================

export async function fetchCampaign(
  id: string
): Promise<Campaign> {
  const res = await apiClient.get<Campaign>(
    `/campaigns/${id}`
  );

  return res.data;
}

// ============================================================
// POST /campaigns/
// ============================================================

export async function createCampaign(
  data: CreateCampaignPayload
): Promise<Campaign> {
  const res = await apiClient.post<Campaign>(
    "/campaigns/",
    data
  );

  return res.data;
}

// ============================================================
// PUT /campaigns/{id}
// ============================================================

export async function updateCampaign(
  id: string,
  data: CreateCampaignPayload
): Promise<Campaign> {
  const res = await apiClient.put<Campaign>(
    `/campaigns/${id}`,
    data
  );

  return res.data;
}

// ============================================================
// POST /campaigns/{id}/transition
// ============================================================

export async function transitionCampaign(
  id: string,
  newStatus: CampaignStatus
): Promise<Campaign> {
  const res = await apiClient.post<Campaign>(
    `/campaigns/${id}/transition`,
    {
      new_status: newStatus,
    }
  );

  return res.data;
}

// ============================================================
// POST /campaigns/{id}/send-all
// ============================================================

export async function sendAllCampaignRecipients(
  id: string
): Promise<{
  campaign_id: string;
  message: string;
  sent: number;
  failed: number;
  channels?: string[];
  channel_results?: Record<
    string,
    {
      sent: number;
      failed: number;
    }
  >;
  campaign_status?: CampaignStatus;
}> {
  const res = await apiClient.post(
    `/campaigns/${id}/send-all`
  );

  return res.data;
}