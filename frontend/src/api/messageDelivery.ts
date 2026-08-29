
import { apiClient } from "./client";

export interface DeliverySummary {
  total: number;
  delivered: number;
  pending: number;
  failed: number;
}

export interface CampaignDeliverySummary {
  campaign_id: string;
  campaign_title: string;
  total: number;
  sent: number;
  delivered: number;
  pending: number;
  failed: number;
}

export interface MessageDelivery {
  id: string;
  recipient_id: string;
  channel: string;
  status: string;
  provider_message_id?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  error_message?: string | null;
}

/**
 * GET /message-delivery/summary
 *
 * Returns the overall delivery statistics.
 */
export async function fetchDeliverySummary(): Promise<DeliverySummary> {
  const response = await apiClient.get<DeliverySummary>(
    "/message-delivery/summary"
  );

  return response.data;
}

/**
 * GET /message-delivery/campaign/{campaign_id}/summary
 *
 * Returns delivery statistics for one campaign.
 */
export async function fetchCampaignDeliverySummary(
  campaignId: string
): Promise<CampaignDeliverySummary> {
  const response = await apiClient.get<CampaignDeliverySummary>(
    `/message-delivery/campaign/${campaignId}/summary`
  );

  return response.data;
}

/**
 * GET /message-delivery/all
 *
 * Returns all message delivery records.
 */
export async function fetchAllDeliveries(): Promise<MessageDelivery[]> {
  const response = await apiClient.get<MessageDelivery[]>(
    "/message-delivery/all"
  );

  return response.data;
}

/**
 * POST /message-delivery/{recipient_id}/send
 *
 * Sends a message to a campaign recipient.
 */
export async function sendMessage(
  recipientId: string
): Promise<MessageDelivery> {
  const response = await apiClient.post<MessageDelivery>(
    `/message-delivery/${recipientId}/send`
  );

  return response.data;
}

/**
 * POST /message-delivery/{recipient_id}/deliver
 *
 * Marks the latest delivery for a recipient as delivered.
 */
export async function markMessageDelivered(
  recipientId: string
): Promise<MessageDelivery> {
  const response = await apiClient.post<MessageDelivery>(
    `/message-delivery/${recipientId}/deliver`
  );

  return response.data;
}

/**
 * POST /message-delivery/{recipient_id}/fail
 *
 * Marks the latest delivery for a recipient as failed.
 */
export async function markMessageFailed(
  recipientId: string
): Promise<MessageDelivery> {
  const response = await apiClient.post<MessageDelivery>(
    `/message-delivery/${recipientId}/fail`
  );

  return response.data;
}

/**
 * GET /message-delivery/{recipient_id}
 *
 * Returns all delivery records for one recipient.
 */
export async function fetchDeliveries(
  recipientId: string
): Promise<MessageDelivery[]> {
  const response = await apiClient.get<MessageDelivery[]>(
    `/message-delivery/${recipientId}`
  );

  return response.data;
}
