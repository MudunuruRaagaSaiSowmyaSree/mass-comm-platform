import { useEffect, useState } from "react";

import {
  fetchCampaignTrackingDashboard,
  fetchCampaignDeliveryLogs,
  retryDelivery,
  type CampaignTrackingDashboard,
  type CampaignDeliveryLogsResponse,
} from "../api/deliveryTracking";

interface CampaignDeliveryPanelProps {
  campaignId: string;
}

export default function CampaignDeliveryPanel({
  campaignId,
}: CampaignDeliveryPanelProps) {
  const [dashboard, setDashboard] =
    useState<CampaignTrackingDashboard | null>(null);

  const [logs, setLogs] =
    useState<CampaignDeliveryLogsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [retryingId, setRetryingId] =
    useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [dashboardResult, logsResult] =
        await Promise.all([
          fetchCampaignTrackingDashboard(
            campaignId
          ),
          fetchCampaignDeliveryLogs(
            campaignId
          ),
        ]);

      setDashboard(dashboardResult);
      setLogs(logsResult);
    } catch (err) {
      console.error(
        "Could not load campaign delivery tracking:",
        err
      );

      setError(
        "Could not load delivery tracking data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [campaignId]);

  async function handleRetry(
    deliveryId: string
  ) {
    setRetryingId(deliveryId);

    try {
      await retryDelivery(deliveryId);

      await loadData();
    } catch (err) {
      console.error(
        "Could not retry delivery:",
        err
      );

      setError(
        "Could not retry this delivery."
      );
    } finally {
      setRetryingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-[13px] text-slate-500">
          Loading delivery tracking...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
        <p className="text-[13px] font-medium text-rose-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() => void loadData()}
          className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
        >
          Retry loading
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="mt-5 space-y-4">
      {/* ======================================================
         DELIVERY SUMMARY
         ====================================================== */}

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">
              Delivery Tracking
            </p>

            <p className="mt-1 text-[11.5px] text-slate-500">
              Delivery status and engagement for this campaign.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <MetricCard
            label="Pending"
            value={
              dashboard.delivery_status.pending
            }
          />

          <MetricCard
            label="Sent"
            value={
              dashboard.delivery_status.sent
            }
          />

          <MetricCard
            label="Delivered"
            value={
              dashboard.delivery_status.delivered
            }
          />

          <MetricCard
            label="Failed"
            value={
              dashboard.delivery_status.failed
            }
          />

          <MetricCard
            label="Retrying"
            value={
              dashboard.delivery_status.retrying
            }
          />
        </div>
      </div>

      {/* ======================================================
         ENGAGEMENT
         ====================================================== */}

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-[14px] font-semibold text-slate-900">
          Engagement
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <EngagementCard
            label="Opens"
            value={
              dashboard.engagement.opens
            }
            rate={
              dashboard.rates.open_rate
            }
          />

          <EngagementCard
            label="Clicks"
            value={
              dashboard.engagement.clicks
            }
            rate={
              dashboard.rates.click_through_rate
            }
          />

          <EngagementCard
            label="Responses"
            value={
              dashboard.engagement.responses
            }
            rate={
              dashboard.rates.response_rate
            }
          />

          <EngagementCard
            label="Participation"
            value={
              dashboard.engagement.participation
            }
            rate={
              dashboard.rates.participation_rate
            }
          />
        </div>
      </div>

      {/* ======================================================
         DELIVERY LOGS
         ====================================================== */}

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">
              Delivery Logs
            </p>

            <p className="mt-1 text-[11.5px] text-slate-500">
              Individual delivery attempts and engagement events.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            {logs?.total_logs ?? 0} logs
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {logs?.logs?.length ? (
            logs.logs.map((log) => (
              <div
                key={log.delivery_id}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-700">
                        {log.channel}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          log.status === "delivered"
                            ? "bg-emerald-50 text-emerald-700"
                            : log.status === "sent"
                              ? "bg-blue-50 text-blue-700"
                              : log.status === "failed"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Delivery ID: {log.delivery_id}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Provider: {log.provider ?? "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.status === "failed" &&
                      log.retry_count <
                        log.max_retries && (
                        <button
                          type="button"
                          disabled={
                            retryingId ===
                            log.delivery_id
                          }
                          onClick={() =>
                            void handleRetry(
                              log.delivery_id
                            )
                          }
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                        >
                          {retryingId ===
                          log.delivery_id
                            ? "Retrying..."
                            : "Retry"}
                        </button>
                      )}
                  </div>
                </div>

                {log.error_message && (
                  <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2">
                    <p className="text-[11px] text-rose-600">
                      {log.error_message}
                    </p>
                  </div>
                )}

                {log.engagement_events.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-slate-600">
                      Engagement Events
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {log.engagement_events.map(
                        (event) => (
                          <span
                            key={event.id}
                            className="rounded-full bg-violet-50 px-2.5 py-1 text-[10.5px] font-semibold capitalize text-violet-700"
                          >
                            {event.type}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-slate-50 p-5 text-center">
              <p className="text-[12px] text-slate-500">
                No delivery logs available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[20px] font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// ENGAGEMENT CARD
// ============================================================

function EngagementCard({
  label,
  value,
  rate,
}: {
  label: string;
  value: number;
  rate: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[20px] font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-500">
        {rate}% rate
      </p>
    </div>
  );
}