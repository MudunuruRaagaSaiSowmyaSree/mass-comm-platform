import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  fetchReportsSummary,
  type ReportsSummary,
} from "../api/reports";

import {
  fetchCampaigns,
  type Campaign,
} from "../api/campaign";

import {
  createFeedback,
  fetchFeedback,
  fetchFeedbackDashboard,
  fetchFeedbackTrend,
  type Feedback,
  type FeedbackDashboard,
  type FeedbackSource,
  type FeedbackTrendResponse,
  type SentimentType,
} from "../api/feedback";


/* ============================================================
   STAT CARD
   ============================================================ */

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-[12.5px] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-[24px] font-bold ${
          className ?? "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}


/* ============================================================
   SENTIMENT CARD
   ============================================================ */

function SentimentCard({
  label,
  count,
  percentage,
  className,
}: {
  label: string;
  count: number;
  percentage: number;
  className: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-slate-500">
          {label}
        </p>

        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${className}`}
        >
          {percentage}%
        </span>
      </div>

      <p className="mt-2 text-[24px] font-bold text-slate-900">
        {count}
      </p>
    </div>
  );
}


/* ============================================================
   BREAKDOWN CARD
   ============================================================ */

function BreakdownCard({
  title,
  items,
  valueKey,
}: {
  title: string;
  items: Array<{
    channel?: string | null;
    language?: string | null;
    geography?: string | null;
    count: number;
  }>;
  valueKey:
    | "channel"
    | "language"
    | "geography";
}) {
  const sorted = [...items]
    .sort(
      (a, b) => b.count - a.count
    )
    .slice(0, 8);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-[14px] font-semibold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-[11.5px] text-slate-500">
        Feedback distribution.
      </p>

      <div className="mt-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-[12px] text-slate-400">
              No data available.
            </p>
          </div>
        ) : (
          sorted.map((item, index) => {
            const label =
              item[valueKey] ||
              "Unknown";

            const total =
              sorted.reduce(
                (sum, current) =>
                  sum + current.count,
                0
              );

            const percentage =
              total > 0
                ? Math.round(
                    (item.count /
                      total) *
                      100
                  )
                : 0;

            return (
              <div
                key={`${String(
                  label
                )}-${index}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[12px] font-medium capitalize text-slate-700">
                    {String(label)}
                  </p>

                  <p className="text-[11px] font-semibold text-slate-500">
                    {item.count}
                  </p>
                </div>

                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#6C5CE7]"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


/* ============================================================
   FEEDBACK SENTIMENT BADGE
   ============================================================ */

function SentimentBadge({
  sentiment,
}: {
  sentiment: SentimentType;
}) {
  const styles: Record<
    SentimentType,
    string
  > = {
    positive:
      "bg-emerald-50 text-emerald-700",
    neutral:
      "bg-slate-100 text-slate-600",
    negative:
      "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold capitalize ${styles[sentiment]}`}
    >
      {sentiment}
    </span>
  );
}


/* ============================================================
   REPORTS PAGE
   ============================================================ */

export default function Reports() {
  /* ==========================================================
     EXISTING REPORTS
     ========================================================== */

  const [report, setReport] =
    useState<ReportsSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ==========================================================
     MODULE 4 DASHBOARD
     ========================================================== */

  const [feedbackDashboard, setFeedbackDashboard] =
    useState<FeedbackDashboard | null>(
      null
    );

  const [feedbackTrend, setFeedbackTrend] =
    useState<FeedbackTrendResponse | null>(
      null
    );

  const [feedback, setFeedback] =
    useState<Feedback[]>([]);

  const [feedbackLoading, setFeedbackLoading] =
    useState(true);

  const [feedbackError, setFeedbackError] =
    useState<string | null>(null);

  /* ==========================================================
     CAMPAIGNS
     ========================================================== */

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);

  const [
    selectedCampaignId,
    setSelectedCampaignId,
  ] = useState("");

  /* ==========================================================
     FILTERS
     ========================================================== */

  const [channelFilter, setChannelFilter] =
    useState("");

  const [languageFilter, setLanguageFilter] =
    useState("");

  const [geographyFilter, setGeographyFilter] =
    useState("");

  const [sentimentFilter, setSentimentFilter] =
    useState<SentimentType | "">("");

  const [sourceFilter, setSourceFilter] =
    useState<FeedbackSource | "">("");

  const [trendDays, setTrendDays] =
    useState(7);

  /* ==========================================================
     FEEDBACK FORM
     ========================================================== */

  const [feedbackMessage, setFeedbackMessage] =
    useState("");

  const [feedbackChannel, setFeedbackChannel] =
    useState("");

  const [feedbackLanguage, setFeedbackLanguage] =
    useState("");

  const [feedbackGeography, setFeedbackGeography] =
    useState("");

  const [feedbackSource, setFeedbackSource] =
    useState<FeedbackSource>("other");

  const [feedbackSubmitting, setFeedbackSubmitting] =
    useState(false);

  const [feedbackFormMessage, setFeedbackFormMessage] =
    useState<string | null>(null);

  /* ==========================================================
     EXISTING REPORT
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError(null);

      try {
        const data =
          await fetchReportsSummary();

        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        console.error(
          "Failed to load reports:",
          err
        );

        if (!cancelled) {
          setError(
            "Could not load report data. Please make sure you are logged in."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     LOAD CAMPAIGNS
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadCampaigns() {
      try {
        const data =
          await fetchCampaigns();

        if (!cancelled) {
          setCampaigns(data);
        }
      } catch (err) {
        console.error(
          "Could not load campaigns for feedback filters:",
          err
        );
      }
    }

    void loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     FILTER OBJECT
     ========================================================== */

  const feedbackFilters = useMemo(
    () => ({
      ...(selectedCampaignId
        ? {
            campaign_id:
              selectedCampaignId,
          }
        : {}),
      ...(channelFilter
        ? {
            channel: channelFilter,
          }
        : {}),
      ...(languageFilter
        ? {
            language: languageFilter,
          }
        : {}),
      ...(geographyFilter
        ? {
            geography:
              geographyFilter,
          }
        : {}),
    }),
    [
      selectedCampaignId,
      channelFilter,
      languageFilter,
      geographyFilter,
    ]
  );

  /* ==========================================================
     LOAD MODULE 4 DATA
     ========================================================== */

  async function loadFeedbackData() {
    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const [
        dashboardResult,
        trendResult,
        feedbackResult,
      ] = await Promise.all([
        fetchFeedbackDashboard(
          feedbackFilters
        ),
        fetchFeedbackTrend(
          trendDays,
          selectedCampaignId ||
            undefined
        ),
        fetchFeedback({
          ...feedbackFilters,
          ...(sentimentFilter
            ? {
                sentiment:
                  sentimentFilter,
              }
            : {}),
          ...(sourceFilter
            ? {
                source:
                  sourceFilter,
              }
            : {}),
          limit: 100,
          offset: 0,
        }),
      ]);

      setFeedbackDashboard(
        dashboardResult
      );

      setFeedbackTrend(
        trendResult
      );

      setFeedback(
        feedbackResult
      );
    } catch (err) {
      console.error(
        "Could not load Module 4 feedback data:",
        err
      );

      setFeedbackError(
        "Could not load feedback and sentiment data."
      );

      setFeedbackDashboard(null);
      setFeedbackTrend(null);
      setFeedback([]);
    } finally {
      setFeedbackLoading(false);
    }
  }

  useEffect(() => {
    void loadFeedbackData();
  }, [
    selectedCampaignId,
    channelFilter,
    languageFilter,
    geographyFilter,
    sentimentFilter,
    sourceFilter,
    trendDays,
  ]);

  /* ==========================================================
     EXISTING CAMPAIGN CHART
     ========================================================== */

  const campaignChartData = report
    ? [
        {
          status: "Completed",
          count:
            report.campaigns.completed,
        },
        {
          status: "Scheduled",
          count:
            report.campaigns.scheduled,
        },
        {
          status: "Sending",
          count:
            report.campaigns.sending,
        },
        {
          status: "Failed",
          count:
            report.campaigns.failed,
        },
      ]
    : [];

  const deliveryRate =
    report?.delivery_rate ?? 0;

  const failureRate =
    report?.failure_rate ?? 0;

  /* ==========================================================
     SENTIMENT CHART DATA
     ========================================================== */

  const sentimentChartData =
    feedbackDashboard
      ? [
          {
            name: "Positive",
            value:
              feedbackDashboard.sentiment
                .positive,
          },
          {
            name: "Neutral",
            value:
              feedbackDashboard.sentiment
                .neutral,
          },
          {
            name: "Negative",
            value:
              feedbackDashboard.sentiment
                .negative,
          },
        ]
      : [];

  /* ==========================================================
     FEEDBACK SUBMIT
     ========================================================== */

  async function handleCreateFeedback(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!feedbackMessage.trim()) {
      setFeedbackFormMessage(
        "Please enter feedback."
      );
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackFormMessage(null);

    try {
      const result =
        await createFeedback({
          campaign_id:
            selectedCampaignId ||
            null,
          source: feedbackSource,
          channel:
            feedbackChannel ||
            null,
          message:
            feedbackMessage.trim(),
          language:
            feedbackLanguage ||
            null,
          geography:
            feedbackGeography ||
            null,
        });

      setFeedbackMessage("");

      setFeedbackFormMessage(
        `Feedback recorded as ${result.sentiment}.`
      );

      await loadFeedbackData();
    } catch (err: any) {
      console.error(
        "Could not create feedback:",
        err
      );

      setFeedbackFormMessage(
        err?.response?.data?.detail ??
          "Could not save feedback."
      );
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  /* ==========================================================
     CLEAR FILTERS
     ========================================================== */

  function clearFeedbackFilters() {
    setSelectedCampaignId("");
    setChannelFilter("");
    setLanguageFilter("");
    setGeographyFilter("");
    setSentimentFilter("");
    setSourceFilter("");
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

      {/* ======================================================
         PAGE HEADER
         ====================================================== */}

      <div>
        <h1 className="text-[22px] font-bold text-slate-900">
          Reports
        </h1>

        <p className="mt-1 text-[13px] text-slate-500">
          Delivery performance, campaign statistics,
          feedback and sentiment analytics.
        </p>
      </div>

      {/* ======================================================
         EXISTING REPORT ERROR
         ====================================================== */}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3">
          <p className="text-[12.5px] text-rose-600">
            {error}
          </p>
        </div>
      )}

      {/* ======================================================
         EXISTING MESSAGE STATISTICS
         ====================================================== */}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">
        <StatCard
          label="Total Messages"
          value={
            loading
              ? "..."
              : String(
                  report?.messages.total ??
                    0
                )
          }
        />

        <StatCard
          label="Delivered"
          value={
            loading
              ? "..."
              : String(
                  report?.messages
                    .delivered ?? 0
                )
          }
          className="text-emerald-600"
        />

        <StatCard
          label="Pending"
          value={
            loading
              ? "..."
              : String(
                  report?.messages.pending ??
                    0
                )
          }
          className="text-amber-600"
        />

        <StatCard
          label="Failed"
          value={
            loading
              ? "..."
              : String(
                  report?.messages.failed ??
                    0
                )
          }
          className="text-rose-600"
        />
      </div>

      {/* ======================================================
         EXISTING CAMPAIGN + DELIVERY
         ====================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Campaigns */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">
            Campaign Statistics
          </p>

          <p className="text-[11.5px] text-slate-500">
            Current campaign status distribution.
          </p>

          <div className="mt-4 h-[220px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={
                  campaignChartData
                }
                margin={{
                  top: 5,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#F1F5F9"
                />

                <XAxis
                  dataKey="status"
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

                <Bar
                  dataKey="count"
                  fill="#6C5CE7"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-[12px] text-slate-500">
              Total campaigns
            </p>

            <p className="mt-1 text-[20px] font-bold text-slate-900">
              {loading
                ? "..."
                : report?.campaigns
                    .total ?? 0}
            </p>
          </div>
        </div>

        {/* Delivery */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">
            Delivery Performance
          </p>

          <p className="text-[11.5px] text-slate-500">
            Message delivery and failure rates.
          </p>

          <div className="mt-6 flex items-center gap-5">
            <div
              className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(
                  #22C55E ${
                    deliveryRate * 3.6
                  }deg,
                  #E2E8F0 0deg
                )`,
              }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[16px] font-bold text-slate-900">
                {loading
                  ? "..."
                  : `${deliveryRate}%`}
              </div>
            </div>

            <div>
              <p className="text-[12.5px] text-slate-500">
                {loading
                  ? "Loading delivery information..."
                  : report
                    ? `${report.messages.delivered} of ${report.messages.total} messages delivered.`
                    : "No delivery data yet."}
              </p>

              {!loading && report && (
                <p className="mt-2 text-[12px] text-rose-500">
                  Failure rate:{" "}
                  {failureRate}%
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Total Recipients
              </p>

              <p className="mt-1 text-[18px] font-bold text-slate-900">
                {loading
                  ? "..."
                  : report?.recipients
                      .total ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Delivered Recipients
              </p>

              <p className="mt-1 text-[18px] font-bold text-emerald-600">
                {loading
                  ? "..."
                  : report?.recipients
                      .delivered ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Pending Recipients
              </p>

              <p className="mt-1 text-[18px] font-bold text-amber-600">
                {loading
                  ? "..."
                  : report?.recipients
                      .pending ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Failed Recipients
              </p>

              <p className="mt-1 text-[18px] font-bold text-rose-600">
                {loading
                  ? "..."
                  : report?.recipients
                      .failed ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
         MODULE 4
         ====================================================== */}

      <div className="mt-8">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900">
            Feedback & Sentiment
          </h2>

          <p className="mt-1 text-[12.5px] text-slate-500">
            Analyze public feedback across campaigns,
            channels, languages and geographies.
          </p>
        </div>

        {/* ====================================================
           FILTERS
           ==================================================== */}

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13.5px] font-semibold text-slate-900">
                Filters
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Drill down into feedback and sentiment.
              </p>
            </div>

            <button
              type="button"
              onClick={
                clearFeedbackFilters
              }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11.5px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

            {/* Campaign */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Campaign
              </label>

              <select
                value={
                  selectedCampaignId
                }
                onChange={(e) =>
                  setSelectedCampaignId(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              >
                <option value="">
                  All Campaigns
                </option>

                {campaigns.map(
                  (campaign) => (
                    <option
                      key={campaign.id}
                      value={campaign.id}
                    >
                      {campaign.title}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Channel */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Channel
              </label>

              <select
                value={
                  channelFilter
                }
                onChange={(e) =>
                  setChannelFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              >
                <option value="">
                  All Channels
                </option>
                <option value="email">
                  Email
                </option>
                <option value="sms">
                  SMS
                </option>
                <option value="whatsapp">
                  WhatsApp
                </option>
                <option value="web">
                  Web
                </option>
                <option value="push">
                  Push
                </option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Language
              </label>

              <input
                value={
                  languageFilter
                }
                onChange={(e) =>
                  setLanguageFilter(
                    e.target.value
                  )
                }
                placeholder="e.g. en"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              />
            </div>

            {/* Geography */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Geography
              </label>

              <input
                value={
                  geographyFilter
                }
                onChange={(e) =>
                  setGeographyFilter(
                    e.target.value
                  )
                }
                placeholder="e.g. Hyderabad"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              />
            </div>

            {/* Sentiment */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Sentiment
              </label>

              <select
                value={
                  sentimentFilter
                }
                onChange={(e) =>
                  setSentimentFilter(
                    e.target.value as
                      | SentimentType
                      | ""
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              >
                <option value="">
                  All Sentiments
                </option>
                <option value="positive">
                  Positive
                </option>
                <option value="neutral">
                  Neutral
                </option>
                <option value="negative">
                  Negative
                </option>
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Source
              </label>

              <select
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(
                    e.target.value as
                      | FeedbackSource
                      | ""
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              >
                <option value="">
                  All Sources
                </option>
                <option value="reply">
                  Reply
                </option>
                <option value="form">
                  Form
                </option>
                <option value="survey">
                  Survey
                </option>
                <option value="comment">
                  Comment
                </option>
                <option value="whatsapp">
                  WhatsApp
                </option>
                <option value="sms">
                  SMS
                </option>
                <option value="email">
                  Email
                </option>
                <option value="web">
                  Web
                </option>
                <option value="other">
                  Other
                </option>
              </select>
            </div>

            {/* Trend Days */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Trend Period
              </label>

              <select
                value={trendDays}
                onChange={(e) =>
                  setTrendDays(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              >
                <option value={7}>
                  Last 7 Days
                </option>
                <option value={14}>
                  Last 14 Days
                </option>
                <option value={30}>
                  Last 30 Days
                </option>
                <option value={90}>
                  Last 90 Days
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* ====================================================
           MODULE 4 ERROR
           ==================================================== */}

        {feedbackError && (
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3">
            <p className="text-[12px] text-rose-600">
              {feedbackError}
            </p>
          </div>
        )}

        {/* ====================================================
           SENTIMENT OVERVIEW
           ==================================================== */}

        <div className="mt-4">
          <div className="mb-3">
            <p className="text-[14px] font-semibold text-slate-900">
              Sentiment Overview
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              label="Total Feedback"
              value={
                feedbackLoading
                  ? "..."
                  : String(
                      feedbackDashboard
                        ?.total_feedback ??
                        0
                    )
              }
            />

            <SentimentCard
              label="Positive"
              count={
                feedbackDashboard
                  ?.sentiment
                  .positive ?? 0
              }
              percentage={
                feedbackDashboard
                  ?.sentiment
                  .positive_percentage ??
                0
              }
              className="bg-emerald-50 text-emerald-700"
            />

            <SentimentCard
              label="Neutral"
              count={
                feedbackDashboard
                  ?.sentiment
                  .neutral ?? 0
              }
              percentage={
                feedbackDashboard
                  ?.sentiment
                  .neutral_percentage ??
                0
              }
              className="bg-slate-100 text-slate-600"
            />

            <SentimentCard
              label="Negative"
              count={
                feedbackDashboard
                  ?.sentiment
                  .negative ?? 0
              }
              percentage={
                feedbackDashboard
                  ?.sentiment
                  .negative_percentage ??
                0
              }
              className="bg-rose-50 text-rose-700"
            />
          </div>
        </div>

        {/* ====================================================
           SENTIMENT + TREND
           ==================================================== */}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Sentiment Pie */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-[14px] font-semibold text-slate-900">
              Sentiment Distribution
            </p>

            <p className="mt-1 text-[11.5px] text-slate-500">
              Positive, neutral and negative feedback.
            </p>

            <div className="mt-3 h-[260px]">
              {sentimentChartData.length ===
              0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-[12px] text-slate-400">
                    No sentiment data.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={
                        sentimentChartData
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={55}
                      paddingAngle={2}
                    >
                      <Cell fill="#22C55E" />
                      <Cell fill="#94A3B8" />
                      <Cell fill="#F43F5E" />
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Trend */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-[14px] font-semibold text-slate-900">
              Feedback Trend
            </p>

            <p className="mt-1 text-[11.5px] text-slate-500">
              Daily feedback and sentiment over the selected period.
            </p>

            <div className="mt-3 h-[260px]">
              {!feedbackTrend ||
              feedbackTrend.trend.length ===
                0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-[12px] text-slate-400">
                    No trend data.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      feedbackTrend.trend
                    }
                    margin={{
                      top: 5,
                      right: 5,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#F1F5F9"
                    />

                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 9,
                        fill: "#94A3B8",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 10,
                        fill: "#94A3B8",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="positive"
                      stackId="sentiment"
                      fill="#22C55E"
                    />

                    <Bar
                      dataKey="neutral"
                      stackId="sentiment"
                      fill="#94A3B8"
                    />

                    <Bar
                      dataKey="negative"
                      stackId="sentiment"
                      fill="#F43F5E"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================
           BREAKDOWNS
           ==================================================== */}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">

          <BreakdownCard
            title="Channel Breakdown"
            items={
              feedbackDashboard
                ?.breakdowns.channel ??
              []
            }
            valueKey="channel"
          />

          <BreakdownCard
            title="Language Breakdown"
            items={
              feedbackDashboard
                ?.breakdowns.language ??
              []
            }
            valueKey="language"
          />

          <BreakdownCard
            title="Geography Breakdown"
            items={
              feedbackDashboard
                ?.breakdowns.geography ??
              []
            }
            valueKey="geography"
          />
        </div>

        {/* ====================================================
           SUBMIT FEEDBACK
           ==================================================== */}

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">
            Record Feedback
          </p>

          <p className="mt-1 text-[11.5px] text-slate-500">
            Submit feedback and automatically analyze its sentiment.
          </p>

          <form
            onSubmit={
              handleCreateFeedback
            }
            className="mt-4 space-y-3"
          >
            <textarea
              value={
                feedbackMessage
              }
              onChange={(e) =>
                setFeedbackMessage(
                  e.target.value
                )
              }
              placeholder="Enter feedback message..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] outline-none focus:border-[#6C5CE7]"
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

              <select
                value={
                  feedbackSource
                }
                onChange={(e) =>
                  setFeedbackSource(
                    e.target
                      .value as FeedbackSource
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              >
                <option value="other">
                  Source: Other
                </option>
                <option value="reply">
                  Reply
                </option>
                <option value="form">
                  Form
                </option>
                <option value="survey">
                  Survey
                </option>
                <option value="comment">
                  Comment
                </option>
                <option value="whatsapp">
                  WhatsApp
                </option>
                <option value="sms">
                  SMS
                </option>
                <option value="email">
                  Email
                </option>
                <option value="web">
                  Web
                </option>
              </select>

              <input
                value={
                  feedbackChannel
                }
                onChange={(e) =>
                  setFeedbackChannel(
                    e.target.value
                  )
                }
                placeholder="Channel"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              />

              <input
                value={
                  feedbackLanguage
                }
                onChange={(e) =>
                  setFeedbackLanguage(
                    e.target.value
                  )
                }
                placeholder="Language e.g. en"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              />

              <input
                value={
                  feedbackGeography
                }
                onChange={(e) =>
                  setFeedbackGeography(
                    e.target.value
                  )
                }
                placeholder="Geography"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-[#6C5CE7]"
              />
            </div>

            {feedbackFormMessage && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[12px] text-slate-600">
                  {feedbackFormMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                feedbackSubmitting
              }
              className="rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] px-5 py-2.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
            >
              {feedbackSubmitting
                ? "Analyzing..."
                : "Submit Feedback"}
            </button>
          </form>
        </div>

        {/* ====================================================
           RECENT FEEDBACK
           ==================================================== */}

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-slate-900">
                Recent Feedback
              </p>

              <p className="mt-1 text-[11.5px] text-slate-500">
                Feedback matching the selected filters.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10.5px] font-semibold text-slate-600">
              {feedback.length} records
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            {feedbackLoading ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center">
                <p className="text-[12px] text-slate-400">
                  Loading feedback...
                </p>
              </div>
            ) : feedback.length ===
              0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center">
                <p className="text-[12px] text-slate-400">
                  No feedback found.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Message
                    </th>

                    <th className="px-3 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Source
                    </th>

                    <th className="px-3 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Channel
                    </th>

                    <th className="px-3 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Language
                    </th>

                    <th className="px-3 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Geography
                    </th>

                    <th className="px-3 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Sentiment
                    </th>

                    <th className="px-3 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Score
                    </th>

                    <th className="px-3 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {feedback.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="max-w-[300px] px-3 py-3">
                          <p className="line-clamp-2 text-[12px] text-slate-700">
                            {item.message}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <span className="capitalize text-[11px] font-medium text-slate-600">
                            {
                              item.source
                            }
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className="capitalize text-[11px] text-slate-500">
                            {
                              item.channel ??
                              "—"
                            }
                          </span>
                        </td>

                        <td className="px-3 py-3 text-[11px] text-slate-500">
                          {
                            item.language ??
                            "—"
                          }
                        </td>

                        <td className="px-3 py-3 text-[11px] text-slate-500">
                          {
                            item.geography ??
                            "—"
                          }
                        </td>

                        <td className="px-3 py-3">
                          <SentimentBadge
                            sentiment={
                              item.sentiment
                            }
                          />
                        </td>

                        <td className="px-3 py-3 text-[11px] font-medium text-slate-600">
                          {item.sentiment_score.toFixed(
                            2
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-[11px] text-slate-500">
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}