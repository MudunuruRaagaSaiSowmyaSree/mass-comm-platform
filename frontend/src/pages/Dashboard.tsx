import { useEffect, useMemo, useState } from "react";
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell,
} from "recharts";
import { Icon, icons } from "../components/Icon";
import { fetchCampaigns, type Campaign } from "../api/campaign";
import { fetchAudience } from "../api/audience";

const STATUS_BUCKETS: { key: string; label: string; color: string; statuses: string[] }[] = [
  { key: "draft", label: "Draft", color: "#6C5CE7", statuses: ["draft"] },
  { key: "review", label: "In Review", color: "#3B8FF3", statuses: ["review"] },
  { key: "scheduled", label: "Scheduled", color: "#F0942F", statuses: ["ready", "scheduled"] },
  { key: "active", label: "Active", color: "#22C55E", statuses: ["sending"] },
  { key: "completed", label: "Completed", color: "#94A3B8", statuses: ["completed", "failed"] },
];

function bucketFor(status: string) {
  return STATUS_BUCKETS.find((b) => b.statuses.includes(status)) ?? STATUS_BUCKETS[0];
}

function StatCard({
  label, value, hint, icon, iconBg,
}: { label: string; value: string; hint: string; icon: string; iconBg: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[12.5px] text-slate-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
          <Icon path={icon} className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="mt-2 text-[26px] font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-[11.5px] font-medium text-emerald-600">{hint}</p>
    </div>
  );
}

function last7Days(): string[] {
  const days: string[] = [];
  const labels: string[] = [];
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
    labels.push(fmt.format(d));
  }
  return labels.map((label, idx) => `${label}|${days[idx]}`);
}

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const c = await fetchCampaigns();
        if (!cancelled) setCampaigns(c);
      } catch {
        if (!cancelled) setError("Could not load campaigns");
      }
      try {
        const a = await fetchAudience();
        if (!cancelled) setAudienceCount(a.length);
      } catch {
        if (!cancelled) setAudienceCount(null);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "sending").length;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_BUCKETS.forEach((b) => (counts[b.key] = 0));
    campaigns.forEach((c) => {
      const bucket = bucketFor(c.status);
      counts[bucket.key] += 1;
    });
    return counts;
  }, [campaigns]);

  const pieData = STATUS_BUCKETS.map((b) => ({ name: b.label, value: statusCounts[b.key], color: b.color }));
  const hasCampaignData = totalCampaigns > 0;

  const timelineData = useMemo(() => {
    const buckets = last7Days().map((entry) => {
      const [label, dateKey] = entry.split("|");
      return { label, dateKey, count: 0 };
    });
    campaigns.forEach((c) => {
      if (!c.created_at) return;
      const dateKey = c.created_at.slice(0, 10);
      const bucket = buckets.find((b) => b.dateKey === dateKey);
      if (bucket) bucket.count += 1;
    });
    return buckets;
  }, [campaigns]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">
          Welcome back, {userEmail} <span>👋</span>
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Here&apos;s an overview of your communication campaigns.
        </p>
      </div>

      {error && <p className="mt-3 text-[12.5px] text-rose-500">{error}</p>}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">
        <StatCard label="Total Campaigns" value={loading ? "…" : String(totalCampaigns)} hint="Based on your campaigns" icon={icons.speaker} iconBg="#6C5CE7" />
        <StatCard label="Active Campaigns" value={loading ? "…" : String(activeCampaigns)} hint={activeCampaigns === 0 ? "No active campaigns" : `${activeCampaigns} running now`} icon={icons.layout} iconBg="#EC5AA7" />
        <StatCard label="Audience Reach" value={audienceCount === null ? "—" : String(audienceCount)} hint={audienceCount === null ? "Connect audience data" : "Total contacts"} icon={icons.users} iconBg="#3B8FF3" />
        <StatCard label="Compliance Score" value="—" hint="Connect compliance data" icon={icons.shield} iconBg="#F0942F" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">Campaigns Over Time</p>
          <p className="text-[11.5px] text-slate-500">Campaigns created during the last 7 days</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6C5CE7" strokeWidth={2.5} dot={{ r: 3, fill: "#6C5CE7" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Total created in this period: {timelineData.reduce((sum, d) => sum + d.count, 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-slate-900">Campaigns by Status</p>
          <p className="text-[11.5px] text-slate-500">Current distribution of campaigns</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-[160px] w-[160px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hasCampaignData ? pieData : [{ name: "None", value: 1, color: "#E2E8F0" }]}
                    dataKey="value" innerRadius={48} outerRadius={72}
                    paddingAngle={hasCampaignData ? 2 : 0} stroke="none"
                  >
                    {(hasCampaignData ? pieData : [{ name: "None", value: 1, color: "#E2E8F0" }]).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[20px] font-bold text-slate-900">{totalCampaigns}</p>
                <p className="text-[10.5px] text-slate-400">Campaigns</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {STATUS_BUCKETS.map((b) => {
                const count = statusCounts[b.key];
                const pct = totalCampaigns > 0 ? Math.round((count / totalCampaigns) * 100) : 0;
                return (
                  <div key={b.key} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                      {b.label}
                    </span>
                    <span className="font-medium text-slate-500">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Campaign Overview</p>
            <p className="text-[11.5px] text-slate-500">Current campaign activity from your platform.</p>
          </div>
          <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-[11.5px] font-semibold text-[#5A3FD6]">
            {totalCampaigns} Total
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUS_BUCKETS.map((b) => (
            <div key={b.key} className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[11.5px] text-slate-500">{b.label}</p>
              <p className="mt-1 text-[20px] font-bold text-slate-900">{statusCounts[b.key]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}