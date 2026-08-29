import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Icon, icons } from "../components/Icon";

import {
  fetchCampaigns,
  type Campaign,
} from "../api/campaign";

import {
  fetchCampaignDeliverySummary,
  type CampaignDeliverySummary,
} from "../api/messageDelivery";

import {
  fetchAnalyticsSummary,
  type AnalyticsSummary,
} from "../api/analytics";

/* ============================================================
   STATUS CONFIGURATION
   ============================================================ */

const STATUS_BUCKETS = [
  {
    key: "draft",
    label: "Draft",
    color: "#6C5CE7",
  },
  {
    key: "review",
    label: "In Review",
    color: "#3B8FF3",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    color: "#F0942F",
  },
  {
    key: "active",
    label: "Active",
    color: "#22C55E",
  },
  {
    key: "completed",
    label: "Completed",
    color: "#94A3B8",
  },
  {
    key: "failed",
    label: "Failed",
    color: "#F43F5E",
  },
];

/* ============================================================
   STATUS BUCKET
   ============================================================ */

function bucketFor(status: string) {
  switch (status) {
    case "draft":
      return STATUS_BUCKETS[0];

    case "review":
      return STATUS_BUCKETS[1];

    case "ready":
    case "scheduled":
      return STATUS_BUCKETS[2];

    case "sending":
      return STATUS_BUCKETS[3];

    case "completed":
      return STATUS_BUCKETS[4];

    case "failed":
      return STATUS_BUCKETS[5];

    default:
      return STATUS_BUCKETS[0];
  }
}

/* ============================================================
   LAST 7 DAYS
   ============================================================ */

function last7Days(): {
  label: string;
  dateKey: string;
}[] {
  const result: {
    label: string;
    dateKey: string;
  }[] = [];

  const formatter = new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "short",
    }
  );

  const now = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now);

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    result.push({
      label: formatter.format(date),
      dateKey,
    });
  }

  return result;
}

/* ============================================================
   STAT CARD
   ============================================================ */

function StatCard({
  label,
  value,
  hint,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  hint: string;
  icon: string;
  iconBg: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-[30px] font-bold leading-none text-slate-900">
            {value}
          </p>

          <p className="mt-3 text-[11.5px] font-semibold text-emerald-600">
            {hint}
          </p>
        </div>

        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: iconBg,
          }}
        >
          <Icon
            path={icon}
            className="h-5 w-5 text-white"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DELIVERY STAT CARD
   ============================================================ */

function DeliveryStatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <p className="text-[11.5px] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-[21px] font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[10.5px] text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */

export default function Dashboard({
  userEmail,
}: {
  userEmail: string;
}) {
  /* ==========================================================
     CAMPAIGNS
     ========================================================== */

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);

  const [campaignLoading, setCampaignLoading] =
    useState(true);

  const [campaignError, setCampaignError] =
    useState<string | null>(null);

  /* ==========================================================
     GLOBAL ANALYTICS
     ========================================================== */

  const [analytics, setAnalytics] =
    useState<AnalyticsSummary | null>(null);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(true);

  const [analyticsError, setAnalyticsError] =
    useState<string | null>(null);

  /* ==========================================================
     CAMPAIGN DELIVERY
     ========================================================== */

  const [
    campaignDelivery,
    setCampaignDelivery,
  ] = useState<CampaignDeliverySummary[]>([]);

  const [
    deliveryLoading,
    setDeliveryLoading,
  ] = useState(true);

  const [
    deliveryError,
    setDeliveryError,
  ] = useState<string | null>(null);

  /* ==========================================================
     LOAD CAMPAIGNS + ANALYTICS
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setCampaignLoading(true);
      setAnalyticsLoading(true);

      setCampaignError(null);
      setAnalyticsError(null);

      const [
        campaignResult,
        analyticsResult,
      ] = await Promise.allSettled([
        fetchCampaigns(),
        fetchAnalyticsSummary(),
      ]);

      if (cancelled) {
        return;
      }

      /* ------------------------------------------------------
         CAMPAIGNS
         ------------------------------------------------------ */

      if (
        campaignResult.status === "fulfilled"
      ) {
        setCampaigns(
          campaignResult.value
        );
      } else {
        console.error(
          "Could not load campaigns:",
          campaignResult.reason
        );

        setCampaignError(
          "Could not load campaigns"
        );
      }

      /* ------------------------------------------------------
         ANALYTICS
         ------------------------------------------------------ */

      if (
        analyticsResult.status === "fulfilled"
      ) {
        setAnalytics(
          analyticsResult.value
        );
      } else {
        console.error(
          "Could not load analytics:",
          analyticsResult.reason
        );

        setAnalyticsError(
          "Could not load analytics"
        );
      }

      setCampaignLoading(false);
      setAnalyticsLoading(false);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     LOAD CAMPAIGN DELIVERY
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadCampaignDelivery() {
      if (campaigns.length === 0) {
        setCampaignDelivery([]);
        setDeliveryLoading(false);
        setDeliveryError(null);
        return;
      }

      setDeliveryLoading(true);
      setDeliveryError(null);

      try {
        const results =
          await Promise.all(
            campaigns.map(
              (campaign) =>
                fetchCampaignDeliverySummary(
                  campaign.id
                )
            )
          );

        if (!cancelled) {
          setCampaignDelivery(results);
        }
      } catch (error) {
        console.error(
          "Could not load campaign delivery performance:",
          error
        );

        if (!cancelled) {
          setDeliveryError(
            "Could not load campaign delivery performance"
          );

          setCampaignDelivery([]);
        }
      } finally {
        if (!cancelled) {
          setDeliveryLoading(false);
        }
      }
    }

    void loadCampaignDelivery();

    return () => {
      cancelled = true;
    };
  }, [campaigns]);

  /* ==========================================================
     GLOBAL VALUES
     ========================================================== */

  const totalCampaigns =
    analytics?.total_campaigns ??
    campaigns.length;

  const activeCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.status === "sending"
    ).length;

  /* ==========================================================
     STATUS COUNTS
     ========================================================== */

  const statusCounts =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      STATUS_BUCKETS.forEach(
        (bucket) => {
          counts[bucket.key] = 0;
        }
      );

      campaigns.forEach(
        (campaign) => {
          const bucket =
            bucketFor(
              campaign.status
            );

          counts[bucket.key] += 1;
        }
      );

      return counts;
    }, [campaigns]);

  /* ==========================================================
     PIE DATA
     ========================================================== */

  const pieData =
    STATUS_BUCKETS.map(
      (bucket) => ({
        name: bucket.label,
        value:
          statusCounts[bucket.key],
        color: bucket.color,
      })
    );

  const hasCampaignData =
    totalCampaigns > 0;

  /* ==========================================================
     CAMPAIGN TIMELINE
     ========================================================== */

  const timelineData =
    useMemo(() => {
      const buckets =
        last7Days().map(
          ({ label, dateKey }) => ({
            label,
            dateKey,
            count: 0,
          })
        );

      campaigns.forEach(
        (campaign) => {
          if (!campaign.created_at) {
            return;
          }

          const dateKey =
            campaign.created_at.slice(
              0,
              10
            );

          const bucket =
            buckets.find(
              (item) =>
                item.dateKey ===
                dateKey
            );

          if (bucket) {
            bucket.count += 1;
          }
        }
      );

      return buckets;
    }, [campaigns]);

  /* ==========================================================
     DELIVERY VALUES
     ========================================================== */

  const deliveryTotals = {
    total:
      analytics?.total_deliveries ?? 0,

    sent:
      analytics?.sent ?? 0,

    delivered:
      analytics?.delivered ?? 0,

    pending:
      analytics?.pending ?? 0,

    failed:
      analytics?.failed ?? 0,
  };

  const deliveryRate =
    analytics?.delivery_rate ?? 0;

  const failureRate =
    analytics?.failure_rate ?? 0;

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

      {/* ======================================================
          HEADER
         ====================================================== */}

      <div>
        <h1 className="text-[22px] font-bold text-slate-900">
          Welcome back, {userEmail}{" "}
          <span>👋</span>
        </h1>

        <p className="mt-1 text-[13px] text-slate-500">
          Here&apos;s an overview of
          your communication campaigns.
        </p>
      </div>

      {(campaignError ||
        analyticsError) && (
        <p className="mt-3 text-[12.5px] text-rose-500">
          {campaignError ||
            analyticsError}
        </p>
      )}

      {/* ======================================================
          MAIN STAT CARDS
         ====================================================== */}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">

        <StatCard
          label="Total Campaigns"
          value={
            campaignLoading ||
            analyticsLoading
              ? "..."
              : String(
                  analytics?.total_campaigns ??
                    totalCampaigns
                )
          }
          hint="Based on your campaigns"
          icon={icons.speaker}
          iconBg="#6C5CE7"
        />

        <StatCard
          label="Active Campaigns"
          value={
            campaignLoading
              ? "..."
              : String(
                  activeCampaigns
                )
          }
          hint={
            activeCampaigns === 0
              ? "No active campaigns"
              : `${activeCampaigns} running now`
          }
          icon={icons.layout}
          iconBg="#EC5AA7"
        />

        <StatCard
          label="Audience Reach"
          value={
            analyticsLoading
              ? "..."
              : analytics
                ? String(
                    analytics.total_recipients
                  )
                : "—"
          }
          hint={
            analytics
              ? "Campaign recipients"
              : "Connect analytics data"
          }
          icon={icons.users}
          iconBg="#3B8FF3"
        />

        <StatCard
          label="Delivery Rate"
          value={
            analyticsLoading
              ? "..."
              : analytics
                ? `${analytics.delivery_rate}%`
                : "—"
          }
          hint={
            analytics
              ? `${analytics.failure_rate}% failure rate`
              : "Connect analytics data"
          }
          icon={icons.shield}
          iconBg="#F0942F"
        />

      </div>

      {/* ======================================================
          CAMPAIGN CHARTS
         ====================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ----------------------------------------------------
            CAMPAIGNS OVER TIME
            ---------------------------------------------------- */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <p className="text-[14px] font-semibold text-slate-900">
            Campaigns Over Time
          </p>

          <p className="text-[11.5px] text-slate-500">
            Campaigns created during the
            last 7 days
          </p>

          <div className="mt-4 h-[220px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={timelineData}
                margin={{
                  top: 5,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                    fill: "#94A3B8",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: "#94A3B8",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6C5CE7"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: "#6C5CE7",
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            Total created in this period:{" "}
            {timelineData.reduce(
              (sum, item) =>
                sum + item.count,
              0
            )}
          </p>

        </div>

        {/* ----------------------------------------------------
            CAMPAIGNS BY STATUS
            ---------------------------------------------------- */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <p className="text-[14px] font-semibold text-slate-900">
            Campaigns by Status
          </p>

          <p className="text-[11.5px] text-slate-500">
            Current distribution of
            campaigns
          </p>

          <div className="mt-2 flex items-center gap-4">

            <div className="relative h-[160px] w-[160px] flex-shrink-0">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      hasCampaignData
                        ? pieData
                        : [
                            {
                              name: "None",
                              value: 1,
                              color:
                                "#E2E8F0",
                            },
                          ]
                    }
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={
                      hasCampaignData
                        ? 2
                        : 0
                    }
                    stroke="none"
                  >

                    {(
                      hasCampaignData
                        ? pieData
                        : [
                            {
                              name: "None",
                              value: 1,
                              color:
                                "#E2E8F0",
                            },
                          ]
                    ).map(
                      (entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.color
                          }
                        />
                      )
                    )}

                  </Pie>

                </PieChart>

              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                <p className="text-[20px] font-bold text-slate-900">
                  {totalCampaigns}
                </p>

                <p className="text-[10.5px] text-slate-400">
                  Campaigns
                </p>

              </div>

            </div>

            <div className="flex-1 space-y-2">

              {STATUS_BUCKETS.map(
                (bucket) => {
                  const count =
                    statusCounts[
                      bucket.key
                    ];

                  const percentage =
                    totalCampaigns >
                    0
                      ? Math.round(
                          (count /
                            totalCampaigns) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={bucket.key}
                      className="flex items-center justify-between text-[12px]"
                    >

                      <span className="flex items-center gap-2 text-slate-600">

                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              bucket.color,
                          }}
                        />

                        {bucket.label}

                      </span>

                      <span className="font-medium text-slate-500">
                        {percentage}%
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          DELIVERY PERFORMANCE
         ====================================================== */}

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-[14px] font-semibold text-slate-900">
              Campaign Delivery Performance
            </p>

            <p className="text-[11.5px] text-slate-500">
              Delivery statistics from the
              analytics service.
            </p>

          </div>

          {!analyticsLoading &&
            analytics && (
              <div className="flex items-center gap-2">

                <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-semibold text-emerald-600">
                  {deliveryRate}% Delivered
                </div>

                <div className="rounded-full bg-rose-50 px-3 py-1 text-[11.5px] font-semibold text-rose-600">
                  {failureRate}% Failed
                </div>

              </div>
            )}

        </div>

        {deliveryError && (
          <p className="mt-3 text-[12px] text-rose-500">
            {deliveryError}
          </p>
        )}

        {/* ----------------------------------------------------
            DELIVERY SUMMARY CARDS
            ---------------------------------------------------- */}

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">

          <DeliveryStatCard
            label="Total"
            value={
              analyticsLoading
                ? 0
                : deliveryTotals.total
            }
            description="Total deliveries"
          />

          <DeliveryStatCard
            label="Sent"
            value={
              analyticsLoading
                ? 0
                : deliveryTotals.sent
            }
            description="Messages sent"
          />

          <DeliveryStatCard
            label="Delivered"
            value={
              analyticsLoading
                ? 0
                : deliveryTotals.delivered
            }
            description="Successfully delivered"
          />

          <DeliveryStatCard
            label="Pending"
            value={
              analyticsLoading
                ? 0
                : deliveryTotals.pending
            }
            description="Waiting to send"
          />

          <DeliveryStatCard
            label="Failed"
            value={
              analyticsLoading
                ? 0
                : deliveryTotals.failed
            }
            description="Delivery failures"
          />

        </div>

        {/* ----------------------------------------------------
            CAMPAIGN DELIVERY TABLE
            ---------------------------------------------------- */}

        <div className="mt-5 overflow-x-auto">

          {deliveryLoading ? (

            <div className="rounded-xl bg-slate-50 p-6 text-center text-[12px] text-slate-500">
              Loading campaign delivery
              performance...
            </div>

          ) : campaignDelivery.length ===
            0 ? (

            <div className="rounded-xl bg-slate-50 p-6 text-center text-[12px] text-slate-500">
              No campaign delivery
              records available.
            </div>

          ) : (

            <table className="w-full min-w-[720px] border-collapse">

              <thead>

                <tr className="border-b border-slate-100 text-left">

                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Campaign
                  </th>

                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Total
                  </th>

                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Sent
                  </th>

                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Delivered
                  </th>

                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Pending
                  </th>

                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Failed
                  </th>

                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Rate
                  </th>

                </tr>

              </thead>

              <tbody>

                {campaignDelivery.map(
                  (delivery) => {

                    const rate =
                      delivery.total >
                      0
                        ? Math.round(
                            (delivery.delivered /
                              delivery.total) *
                              100
                          )
                        : 0;

                    return (

                      <tr
                        key={
                          delivery.campaign_id
                        }
                        className="border-b border-slate-50 last:border-0"
                      >

                        <td className="px-3 py-3">

                          <p className="max-w-[240px] truncate text-[12.5px] font-semibold text-slate-700">
                            {
                              delivery.campaign_title
                            }
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {
                              delivery.campaign_id
                            }
                          </p>

                        </td>

                        <td className="px-3 py-3 text-center text-[12px] font-medium text-slate-600">
                          {delivery.total}
                        </td>

                        <td className="px-3 py-3 text-center text-[12px] font-medium text-slate-600">
                          {delivery.sent}
                        </td>

                        <td className="px-3 py-3 text-center">

                          <span className="inline-flex min-w-[32px] items-center justify-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                            {
                              delivery.delivered
                            }
                          </span>

                        </td>

                        <td className="px-3 py-3 text-center">

                          <span className="inline-flex min-w-[32px] items-center justify-center rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-600">
                            {
                              delivery.pending
                            }
                          </span>

                        </td>

                        <td className="px-3 py-3 text-center">

                          <span className="inline-flex min-w-[32px] items-center justify-center rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600">
                            {
                              delivery.failed
                            }
                          </span>

                        </td>

                        <td className="px-3 py-3 text-center">

                          <span className="text-[12px] font-semibold text-slate-700">
                            {rate}%
                          </span>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

      {/* ======================================================
          ENGAGEMENT SUMMARY
         ====================================================== */}

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <div>

          <p className="text-[14px] font-semibold text-slate-900">
            Engagement Summary
          </p>

          <p className="text-[11.5px] text-slate-500">
            Engagement events recorded across
            all campaigns.
          </p>

        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <DeliveryStatCard
            label="Opens"
            value={
              analytics?.opens ?? 0
            }
            description={
              analytics
                ? `${analytics.open_rate}% open rate`
                : "No analytics"
            }
          />

          <DeliveryStatCard
            label="Clicks"
            value={
              analytics?.clicks ?? 0
            }
            description={
              analytics
                ? `${analytics.click_through_rate}% click rate`
                : "No analytics"
            }
          />

          <DeliveryStatCard
            label="Responses"
            value={
              analytics?.responses ?? 0
            }
            description={
              analytics
                ? `${analytics.response_rate}% response rate`
                : "No analytics"
            }
          />

          <DeliveryStatCard
            label="Participation"
            value={
              analytics?.participation ?? 0
            }
            description={
              analytics
                ? `${analytics.participation_rate}% participation`
                : "No analytics"
            }
          />

        </div>

      </div>

      {/* ======================================================
          CAMPAIGN OVERVIEW
         ====================================================== */}

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-[14px] font-semibold text-slate-900">
              Campaign Overview
            </p>

            <p className="text-[11.5px] text-slate-500">
              Current campaign activity from
              your platform.
            </p>

          </div>

          <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-[11.5px] font-semibold text-[#5A3FD6]">
            {totalCampaigns} Total
          </span>

        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          {STATUS_BUCKETS.map(
            (bucket) => (

              <div
                key={bucket.key}
                className="rounded-xl bg-slate-50 p-3.5"
              >

                <p className="text-[11.5px] text-slate-500">
                  {bucket.label}
                </p>

                <p className="mt-1 text-[20px] font-bold text-slate-900">
                  {
                    statusCounts[
                      bucket.key
                    ]
                  }
                </p>

              </div>

            )
          )}

        </div>

      </div>

    </div>
  );
}
