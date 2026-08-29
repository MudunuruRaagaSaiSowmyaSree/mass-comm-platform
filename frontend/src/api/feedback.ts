import { apiClient } from "./client";

export type FeedbackSource =
  | "reply"
  | "form"
  | "survey"
  | "comment"
  | "whatsapp"
  | "sms"
  | "email"
  | "web"
  | "other";

export type SentimentType =
  | "positive"
  | "neutral"
  | "negative";

// ============================================================
// FEEDBACK
// ============================================================

export interface Feedback {
  id: string;
  campaign_id: string | null;
  audience_member_id: string | null;
  source: FeedbackSource;
  channel: string | null;
  message: string;
  language: string | null;
  geography: string | null;
  sentiment: SentimentType;
  sentiment_score: number;
  analysis_metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateFeedbackPayload {
  campaign_id?: string | null;
  audience_member_id?: string | null;
  source?: FeedbackSource;
  channel?: string | null;
  message: string;
  language?: string | null;
  geography?: string | null;
}

// ============================================================
// FEEDBACK FILTERS
// ============================================================

export interface FeedbackFilters {
  campaign_id?: string;
  channel?: string;
  language?: string;
  geography?: string;
  sentiment?: SentimentType;
  source?: FeedbackSource;
  limit?: number;
  offset?: number;
}

// ============================================================
// SENTIMENT SUMMARY
// ============================================================

export interface SentimentSummary {
  total_feedback: number;
  positive: number;
  neutral: number;
  negative: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface FeedbackBreakdownItem {
  channel?: string | null;
  language?: string | null;
  geography?: string | null;
  count: number;
}

export interface FeedbackDashboard {
  total_feedback: number;
  sentiment: SentimentSummary;
  breakdowns: {
    channel: FeedbackBreakdownItem[];
    language: FeedbackBreakdownItem[];
    geography: FeedbackBreakdownItem[];
  };
}

// ============================================================
// TREND
// ============================================================

export interface FeedbackTrendItem {
  date: string;
  feedback_count: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface FeedbackTrendResponse {
  days: number;
  trend: FeedbackTrendItem[];
}

// ============================================================
// BUILD QUERY
// ============================================================

function buildFeedbackParams(
  filters: FeedbackFilters
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.campaign_id) {
    params.append(
      "campaign_id",
      filters.campaign_id
    );
  }

  if (filters.channel) {
    params.append(
      "channel",
      filters.channel
    );
  }

  if (filters.language) {
    params.append(
      "language",
      filters.language
    );
  }

  if (filters.geography) {
    params.append(
      "geography",
      filters.geography
    );
  }

  if (filters.sentiment) {
    params.append(
      "sentiment",
      filters.sentiment
    );
  }

  if (filters.source) {
    params.append(
      "source",
      filters.source
    );
  }

  if (
    filters.limit !== undefined
  ) {
    params.append(
      "limit",
      String(filters.limit)
    );
  }

  if (
    filters.offset !== undefined
  ) {
    params.append(
      "offset",
      String(filters.offset)
    );
  }

  return params;
}

// ============================================================
// CREATE FEEDBACK
// ============================================================

export async function createFeedback(
  data: CreateFeedbackPayload
): Promise<Feedback> {
  const response =
    await apiClient.post<Feedback>(
      "/feedback",
      data
    );

  return response.data;
}

// ============================================================
// LIST FEEDBACK
// ============================================================

export async function fetchFeedback(
  filters: FeedbackFilters = {}
): Promise<Feedback[]> {
  const params =
    buildFeedbackParams(filters);

  const query =
    params.toString();

  const url = query
    ? `/feedback?${query}`
    : "/feedback";

  const response =
    await apiClient.get<Feedback[]>(
      url
    );

  return response.data;
}

// ============================================================
// SINGLE FEEDBACK
// ============================================================

export async function fetchSingleFeedback(
  feedbackId: string
): Promise<Feedback> {
  const response =
    await apiClient.get<Feedback>(
      `/feedback/${feedbackId}`
    );

  return response.data;
}

// ============================================================
// SENTIMENT SUMMARY
// ============================================================

export async function fetchSentimentSummary(
  filters: Pick<
    FeedbackFilters,
    | "campaign_id"
    | "channel"
    | "language"
    | "geography"
  > = {}
): Promise<SentimentSummary> {
  const params =
    buildFeedbackParams(filters);

  const query =
    params.toString();

  const url = query
    ? `/feedback/analytics/summary?${query}`
    : "/feedback/analytics/summary";

  const response =
    await apiClient.get<SentimentSummary>(
      url
    );

  return response.data;
}

// ============================================================
// FEEDBACK DASHBOARD
// ============================================================

export async function fetchFeedbackDashboard(
  filters: Pick<
    FeedbackFilters,
    | "campaign_id"
    | "channel"
    | "language"
    | "geography"
  > = {}
): Promise<FeedbackDashboard> {
  const params =
    buildFeedbackParams(filters);

  const query =
    params.toString();

  const url = query
    ? `/feedback/analytics/dashboard?${query}`
    : "/feedback/analytics/dashboard";

  const response =
    await apiClient.get<FeedbackDashboard>(
      url
    );

  return response.data;
}

// ============================================================
// FEEDBACK TREND
// ============================================================

export async function fetchFeedbackTrend(
  days = 7,
  campaignId?: string
): Promise<FeedbackTrendResponse> {
  const params =
    new URLSearchParams();

  params.append(
    "days",
    String(days)
  );

  if (campaignId) {
    params.append(
      "campaign_id",
      campaignId
    );
  }

  const response =
    await apiClient.get<FeedbackTrendResponse>(
      `/feedback/analytics/trend?${params.toString()}`
    );

  return response.data;
}