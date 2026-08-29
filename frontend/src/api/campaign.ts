import { apiClient } from "./client";


/* ============================================================
   CAMPAIGN TYPES
   ============================================================ */

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


/* ============================================================
   CAMPAIGN
   ============================================================ */

export interface Campaign {
  id: string;
  title: string;
  content: string;

  type: CampaignType;
  status: CampaignStatus;

  created_by: string;

  target_filters:
    | Record<string, unknown>
    | null;

  template_id:
    | string
    | null;

  scheduled_at:
    | string
    | null;

  started_at:
    | string
    | null;

  completed_at:
    | string
    | null;

  channels: string[];

  created_at:
    | string
    | null;
}


/* ============================================================
   CREATE / UPDATE
   ============================================================ */

export interface CreateCampaignPayload {
  title: string;
  content: string;
  type: CampaignType;

  target_filters?:
    Record<string, unknown>;

  template_id?:
    string | null;

  scheduled_at?:
    string | null;

  channels?:
    string[];
}


/* ============================================================
   TRANSITION
   ============================================================ */

export interface CampaignTransitionPayload {
  new_status: CampaignStatus;
}


/* ============================================================
   FETCH CAMPAIGNS
   ============================================================ */

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response =
    await apiClient.get<Campaign[]>(
      "/campaigns/"
    );

  return response.data;
}


/* ============================================================
   FETCH SINGLE CAMPAIGN
   ============================================================ */

export async function fetchCampaign(
  id: string
): Promise<Campaign> {
  const response =
    await apiClient.get<Campaign>(
      `/campaigns/${id}`
    );

  return response.data;
}


/* ============================================================
   CREATE CAMPAIGN
   ============================================================ */

export async function createCampaign(
  data: CreateCampaignPayload
): Promise<Campaign> {
  const response =
    await apiClient.post<Campaign>(
      "/campaigns/",
      data
    );

  return response.data;
}


/* ============================================================
   UPDATE CAMPAIGN
   ============================================================ */

export async function updateCampaign(
  id: string,
  data: CreateCampaignPayload
): Promise<Campaign> {
  const response =
    await apiClient.put<Campaign>(
      `/campaigns/${id}`,
      data
    );

  return response.data;
}


/* ============================================================
   TRANSITION CAMPAIGN
   ============================================================ */

export async function transitionCampaign(
  id: string,
  newStatus: CampaignStatus
): Promise<Campaign> {
  const response =
    await apiClient.post<Campaign>(
      `/campaigns/${id}/transition`,
      {
        new_status: newStatus,
      }
    );

  return response.data;
}


/* ============================================================
   ASSIGN MATCHING RECIPIENTS
   ============================================================ */

export async function assignMatchingRecipients(
  campaignId: string
) {
  const response =
    await apiClient.post(
      `/campaigns/${campaignId}/recipients/assign`
    );

  return response.data;
}


/* ============================================================
   ADD SINGLE RECIPIENT
   ============================================================ */

export async function addCampaignRecipient(
  campaignId: string,
  audienceMemberId: string
) {
  const response =
    await apiClient.post(
      `/campaigns/${campaignId}/recipients/${audienceMemberId}`
    );

  return response.data;
}


/* ============================================================
   FETCH CAMPAIGN RECIPIENTS
   ============================================================ */

export async function fetchCampaignRecipients(
  campaignId: string
) {
  const response =
    await apiClient.get(
      `/campaigns/${campaignId}/recipients`
    );

  return response.data;
}


/* ============================================================
   SEND ALL RECIPIENTS
   ============================================================ */

export async function sendAllCampaignRecipients(
  campaignId: string
) {
  const response =
    await apiClient.post(
      `/campaigns/${campaignId}/send-all`
    );

  return response.data;
}


/* ============================================================
   DELETE CAMPAIGN
   ============================================================ */

export async function deleteCampaign(
  campaignId: string
): Promise<void> {
  await apiClient.delete(
    `/campaigns/${campaignId}`
  );
}