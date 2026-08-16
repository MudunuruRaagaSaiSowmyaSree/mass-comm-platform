import { useEffect, useState } from "react";
import { Icon, icons } from "../components/Icon";

import {
  fetchCampaigns,
  createCampaign,
  transitionCampaign,
  type Campaign,
  type CampaignType,
  type CampaignStatus,
} from "../api/campaign";

const CAMPAIGN_TYPES: CampaignType[] = [
  "awareness",
  "emergency",
  "educational",
  "announcement",
];

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600",
  },
  review: {
    label: "In Review",
    className: "bg-blue-100 text-blue-700",
  },
  ready: {
    label: "Ready",
    className: "bg-amber-100 text-amber-700",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-amber-100 text-amber-700",
  },
  sending: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700",
  },
  completed: {
    label: "Completed",
    className: "bg-slate-200 text-slate-600",
  },
  failed: {
    label: "Failed",
    className: "bg-rose-100 text-rose-700",
  },
};

const ALLOWED_TRANSITIONS: Record<
  CampaignStatus,
  CampaignStatus[]
> = {
  draft: ["review"],
  review: ["ready", "draft"],
  ready: ["scheduled"],
  scheduled: ["sending"],
  sending: ["completed", "failed"],
  completed: [],
  failed: [],
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}

/* ============================================================
   CAMPAIGN DETAILS MODAL
   ============================================================ */

function CampaignDetailsModal({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  const filters = campaign.target_filters ?? {};

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-slate-900">
              {campaign.title}
            </h2>

            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={campaign.status} />

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                {campaign.type}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[18px] text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* Campaign ID */}
        <div className="mt-5 rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-400">
            Campaign ID
          </p>

          <p className="mt-1 break-all text-[12px] text-slate-600">
            {campaign.id}
          </p>
        </div>

        {/* Campaign Content */}
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-slate-700">
            Campaign Content
          </p>

          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
              {campaign.content || "No content available."}
            </p>
          </div>
        </div>

        {/* Campaign Information */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-[11px] text-slate-400">
              Campaign Type
            </p>

            <p className="mt-1 text-[13px] font-semibold capitalize text-slate-800">
              {campaign.type}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-[11px] text-slate-400">
              Status
            </p>

            <div className="mt-1">
              <StatusBadge status={campaign.status} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-[11px] text-slate-400">
              Created At
            </p>

            <p className="mt-1 text-[13px] font-semibold text-slate-800">
              {campaign.created_at
                ? new Date(
                    campaign.created_at
                  ).toLocaleString()
                : "Not available"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-[11px] text-slate-400">
              Scheduled At
            </p>

            <p className="mt-1 text-[13px] font-semibold text-slate-800">
              {campaign.scheduled_at
                ? new Date(
                    campaign.scheduled_at
                  ).toLocaleString()
                : "Not scheduled"}
            </p>
          </div>

        </div>

        {/* Target Filters */}
        <div className="mt-5">
          <p className="text-[12px] font-semibold text-slate-700">
            Target Filters
          </p>

          {Object.keys(filters).length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-slate-200 p-4">
              <p className="text-[12px] text-slate-400">
                No target filters specified.
              </p>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(filters).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="text-[11px] capitalize text-slate-400">
                    {key.replace(/_/g, " ")}
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-slate-700">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template */}
        <div className="mt-5">
          <p className="text-[12px] font-semibold text-slate-700">
            Template
          </p>

          <p className="mt-1 text-[12px] text-slate-500">
            {campaign.template_id
              ? campaign.template_id
              : "No template linked"}
          </p>
        </div>

        {/* Close */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NEW CAMPAIGN FORM
   ============================================================ */

function NewCampaignForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [type, setType] = useState<CampaignType>(
    CAMPAIGN_TYPES[0]
  );

  const [language, setLanguage] = useState("");
  const [geography, setGeography] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a campaign title.");
      return;
    }

    if (!content.trim()) {
      setError("Please enter campaign content.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const target_filters: Record<string, string> = {};

      if (language.trim()) {
        target_filters.language = language.trim();
      }

      if (geography.trim()) {
        target_filters.geography = geography.trim();
      }

      await createCampaign({
        title: title.trim(),
        content: content.trim(),
        type,
        target_filters,
      });

      onCreated();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Failed to create campaign"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

        <div className="flex items-center justify-between">
          <p className="text-[16px] font-semibold text-slate-900">
            New Campaign
          </p>

          <button
            type="button"
            onClick={onClose}
            className="text-[20px] text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3"
        >
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Campaign title"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
          />

          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Message content"
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
          />

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as CampaignType)
            }
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
          >
            {CAMPAIGN_TYPES.map((campaignType) => (
              <option
                key={campaignType}
                value={campaignType}
              >
                {campaignType}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
              placeholder="Target language (optional)"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />

            <input
              value={geography}
              onChange={(e) =>
                setGeography(e.target.value)
              }
              placeholder="Target geography (optional)"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {error && (
            <p className="text-[12.5px] text-rose-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
          >
            {submitting
              ? "Creating..."
              : "Create Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   CAMPAIGNS PAGE
   ============================================================ */

export default function Campaigns({
  canCreateCampaigns,
}: {
  canCreateCampaigns: boolean;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  const [busyId, setBusyId] = useState<string | null>(
    null
  );

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Could not load campaigns"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleTransition(
    id: string,
    newStatus: CampaignStatus
  ) {
    setBusyId(id);

    try {
      const updatedCampaign = await transitionCampaign(
        id,
        newStatus
      );

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === id
            ? updatedCampaign
            : campaign
        )
      );

      setSelectedCampaign((current) =>
        current?.id === id
          ? updatedCampaign
          : current
      );
    } catch (err: any) {
      alert(
        err?.response?.data?.detail ??
          "Transition failed"
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-[22px] font-bold text-slate-900">
            Campaigns
          </h1>

          <p className="mt-1 text-[13px] text-slate-500">
            View and track your communication campaigns.
          </p>
        </div>

        {/* New Campaign is only visible to Admin and Campaign Manager */}
        {canCreateCampaigns && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            <Icon
              path={icons.megaphone}
              className="h-4 w-4"
            />

            New Campaign
          </button>
        )}

      </div>

      {/* User information */}
      {!canCreateCampaigns && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-[12.5px] text-blue-700">
            You can view campaign details and status, but
            campaign creation is restricted to Admins and
            Campaign Managers.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-[12.5px] text-rose-500">
          {error}
        </p>
      )}

      {/* Campaign List */}
      <div className="mt-5 space-y-3">

        {loading && (
          <p className="text-[13px] text-slate-500">
            Loading campaigns...
          </p>
        )}

        {!loading &&
          campaigns.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-[13px] text-slate-500">
              No campaigns available.
            </div>
          )}

        {campaigns.map((campaign) => {
          const nextOptions =
            ALLOWED_TRANSITIONS[
              campaign.status
            ] ?? [];

          return (
            <div
              key={campaign.id}
              onClick={() =>
                setSelectedCampaign(campaign)
              }
              className="cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">

                {/* Campaign Information */}
                <div className="min-w-0">

                  <div className="flex items-center gap-2.5">
                    <p className="truncate text-[14.5px] font-semibold text-slate-900">
                      {campaign.title}
                    </p>

                    <StatusBadge
                      status={campaign.status}
                    />
                  </div>

                  <p className="mt-1 text-[12px] capitalize text-slate-500">
                    {campaign.type}
                  </p>

                  <p className="mt-2 line-clamp-2 text-[12px] text-slate-400">
                    {campaign.content}
                  </p>
                </div>

                {/* Status Buttons */}
                <div
                  className="flex flex-shrink-0 gap-2"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  {nextOptions.map((next) => (
                    <button
                      key={next}
                      disabled={
                        busyId === campaign.id
                      }
                      onClick={() =>
                        handleTransition(
                          campaign.id,
                          next
                        )
                      }
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:border-[#6C5CE7] hover:text-[#5A3FD6] disabled:opacity-50"
                    >
                      Move to{" "}
                      {STATUS_STYLES[next]?.label ??
                        next}
                    </button>
                  ))}
                </div>

              </div>
            </div>
          );
        })}

      </div>

      {/* New Campaign Modal */}
      {showForm && canCreateCampaigns && (
        <NewCampaignForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          onClose={() =>
            setSelectedCampaign(null)
          }
        />
      )}

    </div>
  );
}