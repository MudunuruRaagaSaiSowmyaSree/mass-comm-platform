import { apiClient } from "./client";

// ============================================================
// TYPES
// ============================================================

export type DeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed";

export type EngagementType =
  | "open"
  | "click"
  | "response"
  | "participation";

// ============================================================
// DELIVERY STATUS
// ============================================================

export interface DeliveryStatusUpdate {
  status: DeliveryStatus;
  error_message?: string | null;
}

// ============================================================
// ENGAGEMENT
// ============================================================

export interface EngagementEventCreate {
  event_type: EngagementType;
  metadata?: Record<string, unknown> | null;
}

export interface EngagementEvent {
  id: string;
  type: EngagementType;
  event_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface DeliveryEngagement {
  delivery_id: string;
  channel: string;
  events: EngagementEvent[];
}

// ============================================================
// STATUS RESPONSE
// ============================================================

export interface DeliveryStatusResponse {
  success: boolean;
  delivery_id: string;
  channel: string;
  status: DeliveryStatus;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  retry_count: number;
  error_message?: string | null;
}

// ============================================================
// RETRY
// ============================================================

export interface RetryDeliveryResponse {
  success: boolean;
  delivery_id: string;
  channel: string;
  status: DeliveryStatus;
  retry_count: number;
  max_retries: number;
  message_id?: string | null;
  error?: string | null;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface CampaignTrackingDeliveryStatus {
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  retrying: number;
}

export interface CampaignTrackingEngagement {
  opens: number;
  clicks: number;
  responses: number;
  participation: number;
}

export interface CampaignTrackingRates {
  open_rate: number;
  click_through_rate: number;
  response_rate: number;
  participation_rate: number;
}

export interface CampaignTrackingDashboard {
  campaign_id: string;
  total_recipients: number;
  total_deliveries: number;
  delivery_status: CampaignTrackingDeliveryStatus;
  engagement: CampaignTrackingEngagement;
  rates: CampaignTrackingRates;
}

// ============================================================
// DELIVERY LOGS
// ============================================================

export interface CampaignDeliveryLogEvent {
  id: string;
  type: EngagementType;
  event_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface CampaignDeliveryLog {
  delivery_id: string;
  recipient_id: string;
  channel: string;
  status: DeliveryStatus;
  provider?: string | null;
  provider_message_id?: string | null;
  retry_count: number;
  max_retries: number;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  last_attempt_at?: string | null;
  error_message?: string | null;
  engagement_events: CampaignDeliveryLogEvent[];
}

export interface CampaignDeliveryLogsResponse {
  campaign_id: string;
  total_logs: number;
  logs: CampaignDeliveryLog[];
}

// ============================================================
// CHANGE DELIVERY STATUS
// ============================================================

/**
 * POST /delivery-tracking/{delivery_id}/status
 *
 * Change the status of a delivery.
 */
export async function changeDeliveryStatus(
  deliveryId: string,
  data: DeliveryStatusUpdate
): Promise<DeliveryStatusResponse> {
  const response =
    await apiClient.post<DeliveryStatusResponse>(
      `/delivery-tracking/${deliveryId}/status`,
      data
    );

  return response.data;
}

// ============================================================
// CREATE ENGAGEMENT EVENT
// ============================================================

/**
 * POST /delivery-tracking/{delivery_id}/engagement
 *
 * Create an engagement event.
 */
export async function createEngagementEvent(
  deliveryId: string,
  data: EngagementEventCreate
): Promise<{
  success: boolean;
  event_id: string;
  delivery_id: string;
  event_type: EngagementType;
  event_at: string;
}> {
  const response = await apiClient.post(
    `/delivery-tracking/${deliveryId}/engagement`,
    data
  );

  return response.data;
}

// ============================================================
// GET DELIVERY ENGAGEMENT
// ============================================================

/**
 * GET /delivery-tracking/{delivery_id}/engagement
 *
 * Get engagement history for a delivery.
 */
export async function fetchDeliveryEngagement(
  deliveryId: string
): Promise<DeliveryEngagement> {
  const response =
    await apiClient.get<DeliveryEngagement>(
      `/delivery-tracking/${deliveryId}/engagement`
    );

  return response.data;
}

// ============================================================
// RETRY DELIVERY
// ============================================================

/**
 * POST /delivery-tracking/{delivery_id}/retry
 *
 * Retry a failed delivery.
 */
export async function retryDelivery(
  deliveryId: string
): Promise<RetryDeliveryResponse> {
  const response =
    await apiClient.post<RetryDeliveryResponse>(
      `/delivery-tracking/${deliveryId}/retry`
    );

  return response.data;
}

// ============================================================
// CAMPAIGN DASHBOARD
// ============================================================

/**
 * GET /delivery-tracking/campaign/{campaign_id}/dashboard
 *
 * Get delivery and engagement dashboard data.
 */
export async function fetchCampaignTrackingDashboard(
  campaignId: string
): Promise<CampaignTrackingDashboard> {
  const response =
    await apiClient.get<CampaignTrackingDashboard>(
      `/delivery-tracking/campaign/${campaignId}/dashboard`
    );

  return response.data;
}

// ============================================================
// CAMPAIGN DELIVERY LOGS
// ============================================================

/**
 * GET /delivery-tracking/campaign/{campaign_id}/logs
 *
 * Get detailed delivery logs and engagement events.
 */
export async function fetchCampaignDeliveryLogs(
  campaignId: string
): Promise<CampaignDeliveryLogsResponse> {
  const response =
    await apiClient.get<CampaignDeliveryLogsResponse>(
      `/delivery-tracking/campaign/${campaignId}/logs`
    );

  return response.data;
}

// ============================================================
// OPEN TRACKING
// ============================================================

/**
 * GET /delivery-tracking/{delivery_id}/open
 *
 * Track an email open.
 *
 * This is normally used by an image/tracking URL rather
 * than directly from the application UI.
 */
export async function trackDeliveryOpen(
  deliveryId: string
): Promise<void> {
  await apiClient.get(
    `/delivery-tracking/${deliveryId}/open`
  );
}

// ============================================================
// CLICK TRACKING
// ============================================================

/**
 * GET /delivery-tracking/{delivery_id}/click
 *
 * Track a click and redirect to the destination URL.
 *
 * This endpoint normally redirects the browser, so callers
 * should generally use the generated URL directly rather
 * than expecting JSON.
 */
export function getDeliveryClickUrl(
  deliveryId: string,
  url: string
): string {
  const encodedUrl =
    encodeURIComponent(url);

  return `/delivery-tracking/${deliveryId}/click?url=${encodedUrl}`;
}