import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  fetchReportsSummary,
  type ReportsSummary,
} from "../api/reports";


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


export default function Reports() {
  const [report, setReport] = useState<ReportsSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );


  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchReportsSummary();

        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);

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

    loadReports();

    return () => {
      cancelled = true;
    };
  }, []);


  const campaignChartData = report
    ? [
        {
          status: "Completed",
          count: report.campaigns.completed,
        },
        {
          status: "Scheduled",
          count: report.campaigns.scheduled,
        },
        {
          status: "Sending",
          count: report.campaigns.sending,
        },
        {
          status: "Failed",
          count: report.campaigns.failed,
        },
      ]
    : [];


  const deliveryRate = report
    ? report.delivery_rate
    : 0;


  const failureRate = report
    ? report.failure_rate
    : 0;


  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

      {/* PAGE HEADER */}

      <h1 className="text-[22px] font-bold text-slate-900">
        Reports
      </h1>

      <p className="mt-1 text-[13px] text-slate-500">
        Delivery performance and campaign statistics.
      </p>


      {/* ERROR */}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3">
          <p className="text-[12.5px] text-rose-600">
            {error}
          </p>
        </div>
      )}


      {/* MESSAGE STATISTICS */}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">

        <StatCard
          label="Total Messages"
          value={
            loading
              ? "..."
              : String(report?.messages.total ?? 0)
          }
        />

        <StatCard
          label="Delivered"
          value={
            loading
              ? "..."
              : String(report?.messages.delivered ?? 0)
          }
          className="text-emerald-600"
        />

        <StatCard
          label="Pending"
          value={
            loading
              ? "..."
              : String(report?.messages.pending ?? 0)
          }
          className="text-amber-600"
        />

        <StatCard
          label="Failed"
          value={
            loading
              ? "..."
              : String(report?.messages.failed ?? 0)
          }
          className="text-rose-600"
        />

      </div>


      {/* CAMPAIGN + DELIVERY */}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">


        {/* CAMPAIGNS */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <p className="text-[14px] font-semibold text-slate-900">
            Campaign Statistics
          </p>

          <p className="text-[11.5px] text-slate-500">
            Current campaign status distribution
          </p>


          <div className="mt-4 h-[220px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={campaignChartData}
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


          {/* TOTAL CAMPAIGNS */}

          <div className="mt-3 border-t border-slate-100 pt-3">

            <p className="text-[12px] text-slate-500">
              Total campaigns
            </p>

            <p className="mt-1 text-[20px] font-bold text-slate-900">
              {loading
                ? "..."
                : report?.campaigns.total ?? 0}
            </p>

          </div>

        </div>


        {/* DELIVERY RATE */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <p className="text-[14px] font-semibold text-slate-900">
            Delivery Performance
          </p>

          <p className="text-[11.5px] text-slate-500">
            Message delivery and failure rates
          </p>


          <div className="mt-6 flex items-center gap-5">

            {/* DELIVERY CIRCLE */}

            <div
              className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(
                  #22C55E ${deliveryRate * 3.6}deg,
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
                  Failure rate: {failureRate}%
                </p>
              )}

            </div>

          </div>


          {/* RECIPIENT STATISTICS */}

          <div className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-slate-50 p-3">

              <p className="text-[11px] text-slate-500">
                Total Recipients
              </p>

              <p className="mt-1 text-[18px] font-bold text-slate-900">
                {loading
                  ? "..."
                  : report?.recipients.total ?? 0}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-3">

              <p className="text-[11px] text-slate-500">
                Delivered Recipients
              </p>

              <p className="mt-1 text-[18px] font-bold text-emerald-600">
                {loading
                  ? "..."
                  : report?.recipients.delivered ?? 0}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-3">

              <p className="text-[11px] text-slate-500">
                Pending Recipients
              </p>

              <p className="mt-1 text-[18px] font-bold text-amber-600">
                {loading
                  ? "..."
                  : report?.recipients.pending ?? 0}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-3">

              <p className="text-[11px] text-slate-500">
                Failed Recipients
              </p>

              <p className="mt-1 text-[18px] font-bold text-rose-600">
                {loading
                  ? "..."
                  : report?.recipients.failed ?? 0}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}