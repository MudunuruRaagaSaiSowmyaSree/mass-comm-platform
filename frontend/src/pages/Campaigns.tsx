import { useEffect, useState } from "react";
import { Icon, icons } from "../components/Icon";

import {
  fetchCampaigns,
  fetchCampaign,
  createCampaign,
  updateCampaign,
  transitionCampaign,
  sendAllCampaignRecipients,
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

const AUDIENCE_OPTIONS = [
  "General Public",
  "Students",
  "Farmers",
  "Senior Citizens",
  "Women",
  "Youth",
  "Healthcare Workers",
  "Government Employees",
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-slate-900">
              {campaign.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={campaign.status} />

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                {campaign.type}
              </span>

              {campaign.channels?.map((channel) => (
                <span
                  key={channel}
                  className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-green-700"
                >
                  {channel}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[18px] text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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

          <div className="rounded-xl border border-slate-100 p-3 sm:col-span-2">
            <p className="text-[11px] text-slate-400">
              Campaign Status
            </p>

            <p className="mt-1 text-[13px] font-semibold capitalize text-slate-800">
              {campaign.status}
            </p>
          </div>
        </div>

        {/* Channels */}
        <div className="mt-5">
          <p className="text-[12px] font-semibold text-slate-700">
            Channels
          </p>

          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
            {campaign.channels &&
            campaign.channels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaign.channels.map((channel) => (
                  <span
                    key={channel}
                    className="rounded-full bg-green-100 px-3 py-1 text-[12px] font-semibold capitalize text-green-700"
                  >
                    {channel}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400">
                No channels specified.
              </p>
            )}
          </div>
        </div>

        {/* Target Audience */}
        <div className="mt-5">
          <p className="text-[12px] font-semibold text-slate-700">
            Target Audience
          </p>

          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[13px] font-semibold text-slate-700">
              {filters.audience
                ? String(filters.audience)
                : "General Public"}
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
              {Object.entries(filters).map(
                ([key, value]) => (
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
                )
              )}
            </div>
          )}
        </div>

        {/* Template */}
        <div className="mt-5">
          <p className="text-[12px] font-semibold text-slate-700">
            Template
          </p>

          <p className="mt-1 break-all text-[12px] text-slate-500">
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
    "educational"
  );

  /*
   * WhatsApp is selected by default.
   */
  const [channels, setChannels] = useState<string[]>([
    "whatsapp",
  ]);

  /* ==========================================================
     AUDIENCE
     ========================================================== */

  const [audience, setAudience] = useState(
    "General Public"
  );

  const [language, setLanguage] = useState("");
  const [geography, setGeography] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");

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

    if (!audience) {
      setError("Please select a target audience.");
      return;
    }

    if (channels.length === 0) {
      setError("Please select at least one channel.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const target_filters: Record<string, string> = {};

      /*
       * Save audience inside target_filters.
       */
      target_filters.audience = audience;

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
        scheduled_at: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : null,
        channels,
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
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
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
          {/* Campaign Title */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Campaign Title
            </label>

            <input
              required
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Campaign title"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Campaign Content */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Message Content
            </label>

            <textarea
              required
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              placeholder="Message content"
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Campaign Type */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Campaign Type
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as CampaignType
                )
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            >
              {CAMPAIGN_TYPES.map(
                (campaignType) => (
                  <option
                    key={campaignType}
                    value={campaignType}
                  >
                    {campaignType
                      .charAt(0)
                      .toUpperCase() +
                      campaignType.slice(1)}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ==================================================
              CHANNELS
             ================================================== */}

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Channels
            </label>

            <div className="rounded-xl border border-slate-200 px-3.5 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-slate-700">
                <input
                  type="checkbox"
                  checked={channels.includes(
                    "whatsapp"
                  )}
                  onChange={(e) => {
                    setChannels((current) => {
                      if (e.target.checked) {
                        if (
                          current.includes(
                            "whatsapp"
                          )
                        ) {
                          return current;
                        }

                        return [
                          ...current,
                          "whatsapp",
                        ];
                      }

                      return current.filter(
                        (channel) =>
                          channel !== "whatsapp"
                      );
                    });
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span>WhatsApp</span>
              </label>
            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Select the channel through which this
              campaign will be delivered.
            </p>
          </div>

          {/* ==================================================
              TARGET AUDIENCE
             ================================================== */}

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Target Audience
            </label>

            <select
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            >
              {AUDIENCE_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Language and Geography */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                Language
              </label>

              <input
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
                placeholder="e.g. English"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                Geography
              </label>

              <input
                value={geography}
                onChange={(e) =>
                  setGeography(e.target.value)
                }
                placeholder="e.g. Telangana"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Schedule Date & Time
            </label>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) =>
                setScheduledAt(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />

            <p className="mt-1 text-[11px] text-slate-400">
              Optional. You can schedule the campaign
              after it is approved.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
              <p className="text-[12.5px] text-rose-500">
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
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
   EDIT CAMPAIGN FORM
   ============================================================ */

function EditCampaignForm({
  campaign,
  onSaved,
  onClose,
}: {
  campaign: Campaign;
  onSaved: (campaign: Campaign) => void;
  onClose: () => void;
}) {
  const filters = campaign.target_filters ?? {};

  const [title, setTitle] = useState(
    campaign.title
  );

  const [content, setContent] = useState(
    campaign.content
  );

  const [type, setType] = useState<CampaignType>(
    campaign.type
  );

  /*
   * IMPORTANT:
   *
   * Preserve the existing campaign channels.
   *
   * Previously, editing a WhatsApp campaign could
   * accidentally cause the backend to use its default
   * ["email"] because channels were not included in the
   * update request.
   */
  const [channels, setChannels] = useState<string[]>(
    campaign.channels?.length
      ? campaign.channels
      : ["whatsapp"]
  );

  const [audience, setAudience] = useState(
    String(
      filters.audience ?? "General Public"
    )
  );

  const [language, setLanguage] = useState(
    String(filters.language ?? "")
  );

  const [geography, setGeography] = useState(
    String(filters.geography ?? "")
  );

  const [scheduledAt, setScheduledAt] = useState(
    campaign.scheduled_at
      ? new Date(campaign.scheduled_at)
          .toISOString()
          .slice(0, 16)
      : ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a campaign title.");
      return;
    }

    if (!content.trim()) {
      setError("Please enter campaign content.");
      return;
    }

    if (!audience) {
      setError("Please select a target audience.");
      return;
    }

    if (channels.length === 0) {
      setError("Please select at least one channel.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const target_filters: Record<
        string,
        string
      > = {
        audience,
      };

      if (language.trim()) {
        target_filters.language =
          language.trim();
      }

      if (geography.trim()) {
        target_filters.geography =
          geography.trim();
      }

      /*
       * IMPORTANT:
       *
       * channels is explicitly included here.
       *
       * This prevents a WhatsApp campaign from
       * becoming an email campaign when edited.
       */
      const updatedCampaign =
        await updateCampaign(
          campaign.id,
          {
            title: title.trim(),
            content: content.trim(),
            type,
            target_filters,
            channels,
            template_id:
              campaign.template_id,
            scheduled_at: scheduledAt
              ? new Date(
                  scheduledAt
                ).toISOString()
              : null,
          }
        );

      onSaved(updatedCampaign);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Failed to update campaign"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[16px] font-semibold text-slate-900">
              Edit Campaign
            </p>

            <p className="mt-1 text-[11.5px] text-slate-500">
              Update the campaign and schedule it
              without creating a new campaign.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 text-[20px] text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3"
        >
          {/* Campaign Title */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Campaign Title
            </label>

            <input
              required
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Campaign title"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Campaign Content */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Message Content
            </label>

            <textarea
              required
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              placeholder="Message content"
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Campaign Type */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Campaign Type
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as CampaignType
                )
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            >
              {CAMPAIGN_TYPES.map(
                (campaignType) => (
                  <option
                    key={campaignType}
                    value={campaignType}
                  >
                    {campaignType
                      .charAt(0)
                      .toUpperCase() +
                      campaignType.slice(1)}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ==================================================
              CHANNELS
             ================================================== */}

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Channels
            </label>

            <div className="rounded-xl border border-slate-200 px-3.5 py-3">
              {/* WhatsApp */}
              <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-slate-700">
                <input
                  type="checkbox"
                  checked={channels.includes(
                    "whatsapp"
                  )}
                  onChange={(e) => {
                    setChannels((current) => {
                      if (e.target.checked) {
                        if (
                          current.includes(
                            "whatsapp"
                          )
                        ) {
                          return current;
                        }

                        return [
                          ...current,
                          "whatsapp",
                        ];
                      }

                      return current.filter(
                        (channel) =>
                          channel !== "whatsapp"
                      );
                    });
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span>WhatsApp</span>
              </label>
            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Select the channel through which this
              campaign will be delivered.
            </p>
          </div>

          {/* ==================================================
              TARGET AUDIENCE
             ================================================== */}

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Target Audience
            </label>

            <select
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            >
              {AUDIENCE_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Language and Geography */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                Language
              </label>

              <input
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
                placeholder="e.g. English"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                Geography
              </label>

              <input
                value={geography}
                onChange={(e) =>
                  setGeography(e.target.value)
                }
                placeholder="e.g. Telangana"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
              Schedule Date & Time
            </label>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) =>
                setScheduledAt(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#6C5CE7]"
            />

            <p className="mt-1 text-[11px] text-slate-400">
              Leave empty if you do not want to
              schedule this campaign.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
              <p className="text-[12.5px] text-rose-500">
                {error}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
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
  const [campaigns, setCampaigns] = useState<
    Campaign[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  const [showForm, setShowForm] = useState(false);

  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  const [editingCampaign, setEditingCampaign] =
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
      const updatedCampaign =
        await transitionCampaign(
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

  async function handleSendAll(id: string) {
    setBusyId(id);

    try {
      const result =
        await sendAllCampaignRecipients(id);

      alert(
        `Send completed.\nSent: ${result.sent}\nFailed: ${result.failed}`
      );

      const updatedCampaign =
        await fetchCampaign(id);

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
          "Failed to send campaign"
      );
    } finally {
      setBusyId(null);
    }
  }

  function handleEdit(campaign: Campaign) {
    setSelectedCampaign(null);
    setEditingCampaign(campaign);
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
            View and track your communication
            campaigns.
          </p>
        </div>

        {/* New Campaign */}
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
            You can view campaign details and
            status, but campaign creation is
            restricted to Admins and Campaign
            Managers.
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

          const audience =
            campaign.target_filters?.audience ??
            "General Public";

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

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[12px] capitalize text-slate-500">
                      {campaign.type}
                    </span>

                    <span className="text-slate-300">
                      •
                    </span>

                    <span className="text-[12px] text-slate-500">
                      Audience:{" "}
                      {String(audience)}
                    </span>

                    {campaign.channels?.map(
                      (channel) => (
                        <span
                          key={channel}
                          className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-green-700"
                        >
                          {channel}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mt-2 line-clamp-2 text-[12px] text-slate-400">
                    {campaign.content}
                  </p>
                </div>

                {/* Action Buttons */}
                <div
                  className="flex flex-shrink-0 flex-wrap justify-end gap-2"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  {canCreateCampaigns && (
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(campaign)
                      }
                      disabled={
                        busyId === campaign.id
                      }
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:border-[#6C5CE7] hover:text-[#5A3FD6] disabled:opacity-50"
                    >
                      Edit
                    </button>
                  )}

                  {nextOptions.map((next) => (
                    <button
                      key={next}
                      type="button"
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
                      {STATUS_STYLES[next]
                        ?.label ?? next}
                    </button>
                  ))}

                  {campaign.status ===
                    "scheduled" && (
                    <button
                      type="button"
                      disabled={
                        busyId === campaign.id
                      }
                      onClick={() =>
                        handleSendAll(
                          campaign.id
                        )
                      }
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      {busyId === campaign.id
                        ? "Sending..."
                        : "Send All"}
                    </button>
                  )}
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

      {/* Edit Campaign Modal */}
      {editingCampaign &&
        canCreateCampaigns && (
          <EditCampaignForm
            campaign={editingCampaign}
            onClose={() =>
              setEditingCampaign(null)
            }
            onSaved={(updatedCampaign) => {
              setCampaigns((current) =>
                current.map((campaign) =>
                  campaign.id ===
                  updatedCampaign.id
                    ? updatedCampaign
                    : campaign
                )
              );

              setEditingCampaign(null);

              setSelectedCampaign(
                updatedCampaign
              );
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