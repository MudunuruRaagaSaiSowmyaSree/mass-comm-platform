import { useEffect, useState } from "react";
import { Icon, icons } from "../components/Icon";
import CampaignDeliveryPanel from "../components/CampaignDeliveryPanel";

import {
  fetchCampaigns,
  fetchCampaign,
  createCampaign,
  updateCampaign,
  transitionCampaign,
  sendAllCampaignRecipients,
  addCampaignRecipient,
  deleteCampaign,
  type Campaign,
  type CampaignType,
  type CampaignStatus,
} from "../api/campaign";

import {
  fetchAudience,
  type AudienceMember,
} from "../api/audience";


/* ============================================================
   CONSTANTS
   ============================================================ */

const CAMPAIGN_TYPES: CampaignType[] = [
  "awareness",
  "emergency",
  "educational",
  "announcement",
];


const CHANNEL_OPTIONS = [
  {
    value: "email",
    label: "Email",
  },
  {
    value: "sms",
    label: "SMS",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
  },
  {
    value: "push",
    label: "Push",
  },
  {
    value: "web_broadcast",
    label: "Web Broadcast",
  },
];


const STATUS_STYLES: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-slate-100 text-slate-600",
  },

  review: {
    label: "In Review",
    className:
      "bg-blue-100 text-blue-700",
  },

  ready: {
    label: "Ready",
    className:
      "bg-amber-100 text-amber-700",
  },

  scheduled: {
    label: "Scheduled",
    className:
      "bg-amber-100 text-amber-700",
  },

  sending: {
    label: "Active",
    className:
      "bg-emerald-100 text-emerald-700",
  },

  completed: {
    label: "Completed",
    className:
      "bg-slate-200 text-slate-600",
  },

  failed: {
    label: "Failed",
    className:
      "bg-rose-100 text-rose-700",
  },
};


const ALLOWED_TRANSITIONS: Record<
  CampaignStatus,
  CampaignStatus[]
> = {
  draft: [
    "review",
  ],

  review: [
    "ready",
    "draft",
  ],

  ready: [
    "scheduled",
  ],

  scheduled: [
    "sending",
  ],

  sending: [
    "completed",
    "failed",
  ],

  completed: [],

  failed: [],
};


/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({
  status,
}: {
  status: string;
}) {

  const style =
    STATUS_STYLES[
      status
    ] ?? {
      label: status,
      className:
        "bg-slate-100 text-slate-600",
    };


  return (
    <span
      className={`
        rounded-full
        px-2.5
        py-1
        text-[11px]
        font-semibold
        ${style.className}
      `}
    >
      {
        style.label
      }
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

  const filters =
    campaign.target_filters ??
    {};


  return (
    <div
      className="
        fixed
        inset-0
        z-30
        flex
        items-center
        justify-center
        bg-slate-900/40
        px-4
      "
      onClick={
        onClose
      }
    >

      <div
        className="
          max-h-[90vh]
          w-full
          max-w-2xl
          overflow-y-auto
          rounded-2xl
          bg-white
          p-6
          shadow-xl
        "
        onClick={(
          e
        ) =>
          e.stopPropagation()
        }
      >

        {/* Header */}

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <h2 className="text-[18px] font-bold text-slate-900">
              {
                campaign.title
              }
            </h2>


            <div className="mt-2 flex flex-wrap items-center gap-2">

              <StatusBadge
                status={
                  campaign.status
                }
              />


              <span className="
                rounded-full
                bg-slate-100
                px-2.5
                py-1
                text-[11px]
                font-semibold
                capitalize
                text-slate-600
              ">
                {
                  campaign.type
                }
              </span>


              {campaign.channels?.map(
                (
                  channel
                ) => (

                  <span
                    key={
                      channel
                    }
                    className="
                      rounded-full
                      bg-green-100
                      px-2.5
                      py-1
                      text-[11px]
                      font-semibold
                      capitalize
                      text-green-700
                    "
                  >
                    {
                      channel
                    }
                  </span>

                )
              )}

            </div>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="
              flex
              h-8
              w-8
              flex-shrink-0
              items-center
              justify-center
              rounded-lg
              text-[18px]
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            ×
          </button>

        </div>


        {/* Campaign ID */}

        <div className="
          mt-5
          rounded-xl
          bg-slate-50
          p-3
        ">

          <p className="text-[11px] font-medium text-slate-400">
            Campaign ID
          </p>

          <p className="mt-1 break-all text-[12px] text-slate-600">
            {
              campaign.id
            }
          </p>

        </div>


        {/* Campaign Content */}

        <div className="mt-4">

          <p className="text-[12px] font-semibold text-slate-700">
            Campaign Content
          </p>

          <div className="
            mt-2
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            p-4
          ">

            <p className="
              whitespace-pre-wrap
              text-[13px]
              leading-6
              text-slate-700
            ">
              {
                campaign.content ||
                "No content available."
              }
            </p>

          </div>

        </div>


        {/* Campaign Information */}

        <div className="
          mt-5
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
        ">

          <div className="
            rounded-xl
            border
            border-slate-100
            p-3
          ">

            <p className="text-[11px] text-slate-400">
              Campaign Type
            </p>

            <p className="
              mt-1
              text-[13px]
              font-semibold
              capitalize
              text-slate-800
            ">
              {
                campaign.type
              }
            </p>

          </div>


          <div className="
            rounded-xl
            border
            border-slate-100
            p-3
          ">

            <p className="text-[11px] text-slate-400">
              Status
            </p>

            <div className="mt-1">

              <StatusBadge
                status={
                  campaign.status
                }
              />

            </div>

          </div>


          <div className="
            rounded-xl
            border
            border-slate-100
            p-3
          ">

            <p className="text-[11px] text-slate-400">
              Created At
            </p>

            <p className="
              mt-1
              text-[13px]
              font-semibold
              text-slate-800
            ">
              {
                campaign.created_at
                  ? new Date(
                      campaign.created_at
                    ).toLocaleString()
                  : "Not available"
              }
            </p>

          </div>


          <div className="
            rounded-xl
            border
            border-slate-100
            p-3
          ">

            <p className="text-[11px] text-slate-400">
              Scheduled At
            </p>

            <p className="
              mt-1
              text-[13px]
              font-semibold
              text-slate-800
            ">
              {
                campaign.scheduled_at
                  ? new Date(
                      campaign.scheduled_at
                    ).toLocaleString()
                  : "Not scheduled"
              }
            </p>

          </div>


          <div className="
            rounded-xl
            border
            border-slate-100
            p-3
            sm:col-span-2
          ">

            <p className="text-[11px] text-slate-400">
              Campaign Status
            </p>

            <p className="
              mt-1
              text-[13px]
              font-semibold
              capitalize
              text-slate-800
            ">
              {
                campaign.status
              }
            </p>


            <CampaignDeliveryPanel
              campaignId={
                campaign.id
              }
            />

          </div>

        </div>


        {/* Channels */}

        <div className="mt-5">

          <p className="text-[12px] font-semibold text-slate-700">
            Channels
          </p>

          <div className="
            mt-2
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            p-4
          ">

            {campaign.channels &&
            campaign.channels.length >
              0 ? (

              <div className="flex flex-wrap gap-2">

                {
                  campaign.channels.map(
                    (
                      channel
                    ) => (

                      <span
                        key={
                          channel
                        }
                        className="
                          rounded-full
                          bg-green-100
                          px-3
                          py-1
                          text-[12px]
                          font-semibold
                          capitalize
                          text-green-700
                        "
                      >
                        {
                          channel
                        }
                      </span>

                    )
                  )
                }

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

          <div className="
            mt-2
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            p-4
          ">

            <p className="
              text-[13px]
              font-semibold
              text-slate-700
            ">
              {
                filters.audience
                  ? String(
                      filters.audience
                    )
                  : "General Public"
              }
            </p>

          </div>

        </div>


        {/* Target Filters */}

        <div className="mt-5">

          <p className="text-[12px] font-semibold text-slate-700">
            Target Filters
          </p>


          {Object.keys(
            filters
          ).length === 0 ? (

            <div className="
              mt-2
              rounded-xl
              border
              border-dashed
              border-slate-200
              p-4
            ">

              <p className="text-[12px] text-slate-400">
                No target filters specified.
              </p>

            </div>

          ) : (

            <div className="
              mt-2
              grid
              grid-cols-1
              gap-2
              sm:grid-cols-2
            ">

              {
                Object.entries(
                  filters
                ).map(
                  (
                    [
                      key,
                      value,
                    ]
                  ) => (

                    <div
                      key={
                        key
                      }
                      className="
                        rounded-xl
                        border
                        border-slate-100
                        bg-slate-50
                        p-3
                      "
                    >

                      <p className="
                        text-[11px]
                        capitalize
                        text-slate-400
                      ">
                        {
                          key.replace(
                            /_/g,
                            " "
                          )
                        }
                      </p>

                      <p className="
                        mt-1
                        text-[13px]
                        font-semibold
                        text-slate-700
                      ">
                        {
                          String(
                            value
                          )
                        }
                      </p>

                    </div>

                  )
                )
              }

            </div>

          )}

        </div>


        {/* Template */}

        <div className="mt-5">

          <p className="text-[12px] font-semibold text-slate-700">
            Template
          </p>

          <p className="
            mt-1
            break-all
            text-[12px]
            text-slate-500
          ">
            {
              campaign.template_id
                ? campaign.template_id
                : "No template linked"
            }
          </p>

        </div>


        {/* Close */}

        <div className="
          mt-6
          flex
          justify-end
        ">

          <button
            type="button"
            onClick={
              onClose
            }
            className="
              rounded-xl
              border
              border-slate-200
              px-4
              py-2
              text-[13px]
              font-medium
              text-slate-600
              hover:border-slate-300
              hover:bg-slate-50
            "
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

  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [type, setType] =
    useState<CampaignType>(
      "educational"
    );

  const [channels, setChannels] =
    useState<string[]>([
      "whatsapp",
    ]);


  /* ==========================================================
     AUDIENCE
     ========================================================== */

  const [
    audienceMembers,
    setAudienceMembers,
  ] = useState<AudienceMember[]>([]);


  const [
    selectedAudienceIds,
    setSelectedAudienceIds,
  ] = useState<string[]>([]);


  const [
    audienceLoading,
    setAudienceLoading,
  ] = useState(true);


  const [
    language,
    setLanguage,
  ] = useState("");


  const [
    geography,
    setGeography,
  ] = useState("");


  const [
    scheduledAt,
    setScheduledAt,
  ] = useState("");


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  /* ==========================================================
     LOAD AUDIENCE
     ========================================================== */

  useEffect(() => {

    let cancelled = false;


    async function loadAudience() {

      setAudienceLoading(
        true
      );


      try {

        const data =
          await fetchAudience();


        if (!cancelled) {

          setAudienceMembers(
            data
          );

        }

      } catch (
        err
      ) {

        console.error(
          "Could not load audience members:",
          err
        );


        if (!cancelled) {

          setError(
            "Could not load audience members."
          );

        }

      } finally {

        if (!cancelled) {

          setAudienceLoading(
            false
          );

        }

      }

    }


    void loadAudience();


    return () => {

      cancelled = true;

    };

  }, []);


  /* ==========================================================
     TOGGLE CHANNEL
     ========================================================== */

  function toggleChannel(
    channelValue: string,
    checked: boolean
  ) {

    setChannels(
      (
        current
      ) => {

        if (checked) {

          return current.includes(
            channelValue
          )
            ? current
            : [
                ...current,
                channelValue,
              ];

        }


        return current.filter(
          (
            channel
          ) =>
            channel !==
            channelValue
        );

      }
    );

  }


  /* ==========================================================
     TOGGLE AUDIENCE
     ========================================================== */

  function toggleAudienceMember(
    audienceMemberId: string,
    checked: boolean
  ) {

    setSelectedAudienceIds(
      (
        current
      ) => {

        if (checked) {

          return current.includes(
            audienceMemberId
          )
            ? current
            : [
                ...current,
                audienceMemberId,
              ];

        }


        return current.filter(
          (
            id
          ) =>
            id !==
            audienceMemberId
        );

      }
    );

  }


  /* ==========================================================
     SUBMIT
     ========================================================== */

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();


    if (!title.trim()) {

      setError(
        "Please enter a campaign title."
      );

      return;
    }


    if (!content.trim()) {

      setError(
        "Please enter campaign content."
      );

      return;
    }


    if (
      selectedAudienceIds.length === 0
    ) {

      setError(
        "Please select at least one audience member."
      );

      return;
    }


    if (
      channels.length === 0
    ) {

      setError(
        "Please select at least one channel."
      );

      return;
    }


    setSubmitting(
      true
    );

    setError(
      null
    );


    try {

      const selectedAudienceMembers =
        audienceMembers.filter(
          (
            member
          ) =>
            selectedAudienceIds.includes(
              member.id
            )
        );


      if (
        selectedAudienceMembers.length ===
        0
      ) {

        throw new Error(
          "Selected audience members could not be found."
        );

      }


      const target_filters:
        Record<string, string> = {

        audience:
          selectedAudienceMembers.length ===
          1
            ? selectedAudienceMembers[0]
                .name
            : `${selectedAudienceMembers.length} selected audience members`,

      };


      if (
        language.trim()
      ) {

        target_filters.language =
          language.trim();

      }


      if (
        geography.trim()
      ) {

        target_filters.geography =
          geography.trim();

      }


      const createdCampaign =
        await createCampaign({

          title:
            title.trim(),

          content:
            content.trim(),

          type,

          target_filters,

          scheduled_at:
            scheduledAt
              ? new Date(
                  scheduledAt
                ).toISOString()
              : null,

          channels,

        });


      await Promise.all(
        selectedAudienceIds.map(
          (
            audienceMemberId
          ) =>
            addCampaignRecipient(
              createdCampaign.id,
              audienceMemberId
            )
        )
      );


      onCreated();

    } catch (
      err: any
    ) {

      console.error(
        "Campaign creation failed:",
        err
      );


      setError(
        err?.response?.data?.detail ??
          err?.message ??
          "Failed to create campaign"
      );

    } finally {

      setSubmitting(
        false
      );

    }

  }


  return (
    <div className="
      fixed
      inset-0
      z-20
      flex
      items-center
      justify-center
      bg-slate-900/40
      px-4
    ">

      <div className="
        max-h-[90vh]
        w-full
        max-w-lg
        overflow-y-auto
        rounded-2xl
        bg-white
        p-6
        shadow-xl
      ">

        <div className="
          flex
          items-center
          justify-between
        ">

          <p className="
            text-[16px]
            font-semibold
            text-slate-900
          ">
            New Campaign
          </p>


          <button
            type="button"
            onClick={
              onClose
            }
            className="
              text-[20px]
              text-slate-400
              hover:text-slate-600
            "
          >
            ×
          </button>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
          className="
            mt-4
            space-y-3
          "
        >

          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Campaign Title
            </label>


            <input
              required
              value={
                title
              }
              onChange={(
                e
              ) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="Campaign title"
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            />

          </div>


          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Message Content
            </label>


            <textarea
              required
              value={
                content
              }
              onChange={(
                e
              ) =>
                setContent(
                  e.target.value
                )
              }
              placeholder="Message content"
              rows={4}
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            />

          </div>


          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Campaign Type
            </label>


            <select
              value={
                type
              }
              onChange={(
                e
              ) =>
                setType(
                  e.target.value as CampaignType
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            >

              {CAMPAIGN_TYPES.map(
                (
                  campaignType
                ) => (

                  <option
                    key={
                      campaignType
                    }
                    value={
                      campaignType
                    }
                  >
                    {
                      campaignType
                        .charAt(0)
                        .toUpperCase() +
                      campaignType.slice(1)
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {/* Channels */}

          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Channels
            </label>


            <div className="
              grid
              grid-cols-1
              gap-2
              sm:grid-cols-2
            ">

              {CHANNEL_OPTIONS.map(
                (
                  channel
                ) => {

                  const checked =
                    channels.includes(
                      channel.value
                    );


                  return (
                    <label
                      key={
                        channel.value
                      }
                      className="
                        flex
                        cursor-pointer
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        px-3.5
                        py-3
                        text-[13.5px]
                        text-slate-700
                        hover:bg-slate-50
                      "
                    >

                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={(
                          e
                        ) =>
                          toggleChannel(
                            channel.value,
                            e.target.checked
                          )
                        }
                        className="
                          h-4
                          w-4
                          rounded
                          border-slate-300
                        "
                      />

                      <span>
                        {
                          channel.label
                        }
                      </span>

                    </label>
                  );

                }
              )}

            </div>

            <p className="
              mt-1
              text-[11px]
              text-slate-400
            ">
              Select one or more channels through
              which this campaign will be delivered.
            </p>

          </div>


          {/* Target Audience */}

          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Target Audience
            </label>


            <div className="
              rounded-xl
              border
              border-slate-200
              p-3
            ">

              {audienceLoading ? (

                <div className="
                  rounded-lg
                  bg-slate-50
                  p-4
                  text-center
                ">

                  <p className="
                    text-[12px]
                    text-slate-400
                  ">
                    Loading audience members...
                  </p>

                </div>

              ) : audienceMembers.length ===
                0 ? (

                <div className="
                  rounded-lg
                  bg-slate-50
                  p-4
                  text-center
                ">

                  <p className="
                    text-[12px]
                    text-slate-500
                  ">
                    No audience members available.
                  </p>

                </div>

              ) : (

                <>

                  <div className="
                    max-h-56
                    space-y-2
                    overflow-y-auto
                    pr-1
                  ">

                    {audienceMembers.map(
                      (
                        member
                      ) => {

                        const checked =
                          selectedAudienceIds.includes(
                            member.id
                          );


                        return (
                          <label
                            key={
                              member.id
                            }
                            className={`
                              flex
                              cursor-pointer
                              items-start
                              gap-3
                              rounded-xl
                              border
                              px-3
                              py-2.5
                              transition
                              ${
                                checked
                                  ? "border-[#8B7CF6] bg-violet-50"
                                  : "border-slate-100 hover:bg-slate-50"
                              }
                            `}
                          >

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={(
                                e
                              ) =>
                                toggleAudienceMember(
                                  member.id,
                                  e.target.checked
                                )
                              }
                              className="
                                mt-0.5
                                h-4
                                w-4
                                rounded
                                border-slate-300
                              "
                            />


                            <div className="
                              min-w-0
                              flex-1
                            ">

                              <div className="
                                flex
                                items-center
                                justify-between
                                gap-2
                              ">

                                <p className="
                                  truncate
                                  text-[13px]
                                  font-semibold
                                  text-slate-700
                                ">
                                  {
                                    member.name
                                  }
                                </p>


                                {checked && (
                                  <span className="
                                    rounded-full
                                    bg-violet-100
                                    px-2
                                    py-0.5
                                    text-[9.5px]
                                    font-semibold
                                    text-violet-700
                                  ">
                                    Selected
                                  </span>
                                )}

                              </div>


                              <p className="
                                mt-0.5
                                truncate
                                text-[11px]
                                text-slate-400
                              ">
                                {
                                  [
                                    member.email,
                                    member.phone,
                                    member.geography,
                                  ]
                                    .filter(
                                      Boolean
                                    )
                                    .join(
                                      " • "
                                    ) ||
                                  "No contact details"
                                }
                              </p>

                            </div>

                          </label>
                        );

                      }
                    )}

                  </div>


                  <div className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    border-t
                    border-slate-100
                    pt-3
                  ">

                    <p className="
                      text-[11px]
                      text-slate-400
                    ">
                      {
                        selectedAudienceIds.length
                      }{" "}
                      selected
                    </p>


                    {selectedAudienceIds.length >
                      0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAudienceIds(
                            []
                          )
                        }
                        className="
                          text-[11px]
                          font-medium
                          text-slate-500
                          hover:text-rose-500
                        "
                      >
                        Clear selection
                      </button>
                    )}

                  </div>

                </>

              )}

            </div>

          </div>


          {/* Language / Geography */}

          <div className="
            grid
            grid-cols-2
            gap-3
          ">

            <div>

              <label className="
                mb-1.5
                block
                text-[12px]
                font-semibold
                text-slate-700
              ">
                Language
              </label>


              <input
                value={
                  language
                }
                onChange={(
                  e
                ) =>
                  setLanguage(
                    e.target.value
                  )
                }
                placeholder="e.g. English"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3.5
                  py-2.5
                  text-[13.5px]
                  outline-none
                  focus:border-[#6C5CE7]
                "
              />

            </div>


            <div>

              <label className="
                mb-1.5
                block
                text-[12px]
                font-semibold
                text-slate-700
              ">
                Geography
              </label>


              <input
                value={
                  geography
                }
                onChange={(
                  e
                ) =>
                  setGeography(
                    e.target.value
                  )
                }
                placeholder="e.g. Telangana"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3.5
                  py-2.5
                  text-[13.5px]
                  outline-none
                  focus:border-[#6C5CE7]
                "
              />

            </div>

          </div>


          {/* Schedule */}

          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Schedule Date & Time
            </label>


            <input
              type="datetime-local"
              value={
                scheduledAt
              }
              onChange={(
                e
              ) =>
                setScheduledAt(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            />

          </div>


          {error && (
            <div className="
              rounded-xl
              border
              border-rose-100
              bg-rose-50
              px-3
              py-2
            ">

              <p className="
                text-[12.5px]
                text-rose-500
              ">
                {
                  error
                }
              </p>

            </div>
          )}


          <button
            type="submit"
            disabled={
              submitting ||
              audienceLoading ||
              audienceMembers.length ===
                0
            }
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-[#7C6CF0]
              to-[#5A3FD6]
              py-2.5
              text-[13.5px]
              font-semibold
              text-white
              disabled:opacity-60
            "
          >
            {
              submitting
                ? "Creating..."
                : "Create Campaign"
            }
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
  onSaved: (
    campaign: Campaign
  ) => void;
  onClose: () => void;
}) {

  const filters =
    campaign.target_filters ??
    {};


  const [title, setTitle] =
    useState(
      campaign.title
    );


  const [content, setContent] =
    useState(
      campaign.content
    );


  const [type, setType] =
    useState<CampaignType>(
      campaign.type
    );


  const [channels, setChannels] =
    useState<string[]>(
      campaign.channels?.length
        ? campaign.channels
        : ["whatsapp"]
    );


  const [audience, setAudience] =
    useState(
      String(
        filters.audience ??
          "General Public"
      )
    );


  const [language, setLanguage] =
    useState(
      String(
        filters.language ??
          ""
      )
    );


  const [geography, setGeography] =
    useState(
      String(
        filters.geography ??
          ""
      )
    );


  const [scheduledAt, setScheduledAt] =
    useState(
      campaign.scheduled_at
        ? new Date(
            campaign.scheduled_at
          )
            .toISOString()
            .slice(
              0,
              16
            )
        : ""
    );


  const [submitting, setSubmitting] =
    useState(false);


  const [error, setError] =
    useState<string | null>(
      null
    );


  function toggleEditChannel(
    channelValue: string,
    checked: boolean
  ) {

    setChannels(
      (
        current
      ) => {

        if (checked) {

          return current.includes(
            channelValue
          )
            ? current
            : [
                ...current,
                channelValue,
              ];

        }


        return current.filter(
          (
            channel
          ) =>
            channel !==
            channelValue
        );

      }
    );

  }


  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();


    if (!title.trim()) {

      setError(
        "Please enter a campaign title."
      );

      return;
    }


    if (!content.trim()) {

      setError(
        "Please enter campaign content."
      );

      return;
    }


    if (!audience) {

      setError(
        "Please enter a target audience."
      );

      return;
    }


    if (
      channels.length ===
      0
    ) {

      setError(
        "Please select at least one channel."
      );

      return;
    }


    setSubmitting(
      true
    );

    setError(
      null
    );


    try {

      const target_filters:
        Record<string, string> = {
        audience,
      };


      if (
        language.trim()
      ) {

        target_filters.language =
          language.trim();

      }


      if (
        geography.trim()
      ) {

        target_filters.geography =
          geography.trim();

      }


      const updatedCampaign =
        await updateCampaign(
          campaign.id,
          {
            title:
              title.trim(),

            content:
              content.trim(),

            type,

            target_filters,

            channels,

            template_id:
              campaign.template_id,

            scheduled_at:
              scheduledAt
                ? new Date(
                    scheduledAt
                  ).toISOString()
                : null,
          }
        );


      onSaved(
        updatedCampaign
      );

    } catch (
      err: any
    ) {

      setError(
        err?.response?.data?.detail ??
          "Failed to update campaign"
      );

    } finally {

      setSubmitting(
        false
      );

    }

  }


  return (
    <div className="
      fixed
      inset-0
      z-30
      flex
      items-center
      justify-center
      bg-slate-900/40
      px-4
    ">

      <div className="
        max-h-[90vh]
        w-full
        max-w-lg
        overflow-y-auto
        rounded-2xl
        bg-white
        p-6
        shadow-xl
      ">

        <div className="
          flex
          items-center
          justify-between
        ">

          <div>

            <p className="
              text-[16px]
              font-semibold
              text-slate-900
            ">
              Edit Campaign
            </p>

            <p className="
              mt-1
              text-[11.5px]
              text-slate-500
            ">
              Update the campaign and schedule it
              without creating a new campaign.
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="
              flex-shrink-0
              text-[20px]
              text-slate-400
              hover:text-slate-600
            "
          >
            ×
          </button>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
          className="
            mt-4
            space-y-3
          "
        >

          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Campaign Title
            </label>


            <input
              required
              value={
                title
              }
              onChange={(
                e
              ) =>
                setTitle(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            />

          </div>


          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Message Content
            </label>


            <textarea
              required
              value={
                content
              }
              onChange={(
                e
              ) =>
                setContent(
                  e.target.value
                )
              }
              rows={4}
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            />

          </div>


          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Campaign Type
            </label>


            <select
              value={
                type
              }
              onChange={(
                e
              ) =>
                setType(
                  e.target.value as CampaignType
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            >

              {CAMPAIGN_TYPES.map(
                (
                  campaignType
                ) => (

                  <option
                    key={
                      campaignType
                    }
                    value={
                      campaignType
                    }
                  >
                    {
                      campaignType
                        .charAt(0)
                        .toUpperCase() +
                      campaignType.slice(1)
                    }
                  </option>

                )
              )}

            </select>

          </div>


          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Channels
            </label>


            <div className="
              grid
              grid-cols-1
              gap-2
              sm:grid-cols-2
            ">

              {CHANNEL_OPTIONS.map(
                (
                  channel
                ) => {

                  const checked =
                    channels.includes(
                      channel.value
                    );


                  return (
                    <label
                      key={
                        channel.value
                      }
                      className="
                        flex
                        cursor-pointer
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        px-3.5
                        py-3
                        text-[13.5px]
                        text-slate-700
                        hover:bg-slate-50
                      "
                    >

                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={(
                          e
                        ) =>
                          toggleEditChannel(
                            channel.value,
                            e.target.checked
                          )
                        }
                        className="
                          h-4
                          w-4
                          rounded
                          border-slate-300
                        "
                      />

                      <span>
                        {
                          channel.label
                        }
                      </span>

                    </label>
                  );

                }
              )}

            </div>

          </div>


          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Target Audience
            </label>


            <input
              value={
                audience
              }
              onChange={(
                e
              ) =>
                setAudience(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            />

          </div>


          <div className="
            grid
            grid-cols-2
            gap-3
          ">

            <div>

              <label className="
                mb-1.5
                block
                text-[12px]
                font-semibold
                text-slate-700
              ">
                Language
              </label>


              <input
                value={
                  language
                }
                onChange={(
                  e
                ) =>
                  setLanguage(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3.5
                  py-2.5
                  text-[13.5px]
                  outline-none
                  focus:border-[#6C5CE7]
                "
              />

            </div>


            <div>

              <label className="
                mb-1.5
                block
                text-[12px]
                font-semibold
                text-slate-700
              ">
                Geography
              </label>


              <input
                value={
                  geography
                }
                onChange={(
                  e
                ) =>
                  setGeography(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3.5
                  py-2.5
                  text-[13.5px]
                  outline-none
                  focus:border-[#6C5CE7]
                "
              />

            </div>

          </div>


          <div>

            <label className="
              mb-1.5
              block
              text-[12px]
              font-semibold
              text-slate-700
            ">
              Schedule Date & Time
            </label>


            <input
              type="datetime-local"
              value={
                scheduledAt
              }
              onChange={(
                e
              ) =>
                setScheduledAt(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                py-2.5
                text-[13.5px]
                outline-none
                focus:border-[#6C5CE7]
              "
            />

          </div>


          {error && (
            <div className="
              rounded-xl
              border
              border-rose-100
              bg-rose-50
              px-3
              py-2
            ">

              <p className="
                text-[12.5px]
                text-rose-500
              ">
                {
                  error
                }
              </p>

            </div>
          )}


          <div className="
            flex
            justify-end
            gap-2
            pt-2
          ">

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                submitting
              }
              className="
                rounded-xl
                border
                border-slate-200
                px-4
                py-2.5
                text-[13px]
                font-medium
                text-slate-600
                hover:bg-slate-50
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                submitting
              }
              className="
                rounded-xl
                bg-gradient-to-r
                from-[#7C6CF0]
                to-[#5A3FD6]
                px-5
                py-2.5
                text-[13px]
                font-semibold
                text-white
                disabled:opacity-60
              "
            >
              {
                submitting
                  ? "Saving..."
                  : "Save Changes"
              }
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

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState<string | null>(
      null
    );


  const [showForm, setShowForm] =
    useState(false);


  const [
    selectedCampaign,
    setSelectedCampaign,
  ] = useState<Campaign | null>(
    null
  );


  const [
    editingCampaign,
    setEditingCampaign,
  ] = useState<Campaign | null>(
    null
  );


  const [busyId, setBusyId] =
    useState<string | null>(
      null
    );


  /* ==========================================================
     DELETE STATE
     ========================================================== */

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null
  );


  /* ==========================================================
     LOAD CAMPAIGNS
     ========================================================== */

  async function load() {

    setLoading(true);

    setError(null);


    try {

      const data =
        await fetchCampaigns();


      setCampaigns(
        data
      );

    } catch (
      err: any
    ) {

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


  /* ==========================================================
     TRANSITION
     ========================================================== */

  async function handleTransition(
    id: string,
    newStatus: CampaignStatus
  ) {

    setBusyId(
      id
    );


    try {

      const updatedCampaign =
        await transitionCampaign(
          id,
          newStatus
        );


      setCampaigns(
        (
          current
        ) =>
          current.map(
            (
              campaign
            ) =>
              campaign.id ===
              id
                ? updatedCampaign
                : campaign
          )
      );


      setSelectedCampaign(
        (
          current
        ) =>
          current?.id ===
          id
            ? updatedCampaign
            : current
      );

    } catch (
      err: any
    ) {

      alert(
        err?.response?.data?.detail ??
          "Transition failed"
      );

    } finally {

      setBusyId(
        null
      );

    }

  }


  /* ==========================================================
     SEND ALL
     ========================================================== */

  async function handleSendAll(
    id: string
  ) {

    setBusyId(
      id
    );


    try {

      const result =
        await sendAllCampaignRecipients(
          id
        );


      alert(
        `Send completed.\nSent: ${result.sent}\nFailed: ${result.failed}`
      );


      const updatedCampaign =
        await fetchCampaign(
          id
        );


      setCampaigns(
        (
          current
        ) =>
          current.map(
            (
              campaign
            ) =>
              campaign.id ===
              id
                ? updatedCampaign
                : campaign
          )
      );


      setSelectedCampaign(
        (
          current
        ) =>
          current?.id ===
          id
            ? updatedCampaign
            : current
      );

    } catch (
      err: any
    ) {

      alert(
        err?.response?.data?.detail ??
          "Failed to send campaign"
      );

    } finally {

      setBusyId(
        null
      );

    }

  }


  /* ==========================================================
     EDIT
     ========================================================== */

  function handleEdit(
    campaign: Campaign
  ) {

    setSelectedCampaign(
      null
    );

    setEditingCampaign(
      campaign
    );

  }


  /* ==========================================================
     DELETE
     ========================================================== */

  async function handleDeleteCampaign(
    campaign: Campaign
  ) {

    /* --------------------------------------------------------
       Confirmation
       -------------------------------------------------------- */

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${campaign.title}"?\n\nThis action cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    /* --------------------------------------------------------
       Set deleting state
       -------------------------------------------------------- */

    setDeletingId(
      campaign.id
    );


    setError(
      null
    );


    try {

      /* ------------------------------------------------------
         Delete from backend
         ------------------------------------------------------ */

      await deleteCampaign(
        campaign.id
      );


      /* ------------------------------------------------------
         Remove immediately from UI
         ------------------------------------------------------ */

      setCampaigns(
        (
          current
        ) =>
          current.filter(
            (
              item
            ) =>
              item.id !==
              campaign.id
          )
      );


      /* ------------------------------------------------------
         Close selected details modal if the deleted
         campaign was open.
         ------------------------------------------------------ */

      setSelectedCampaign(
        (
          current
        ) =>
          current?.id ===
          campaign.id
            ? null
            : current
      );


      /* ------------------------------------------------------
         Close edit modal if needed.
         ------------------------------------------------------ */

      setEditingCampaign(
        (
          current
        ) =>
          current?.id ===
          campaign.id
            ? null
            : current
      );

    } catch (
      err: any
    ) {

      console.error(
        "Failed to delete campaign:",
        err
      );


      setError(
        err?.response?.data?.detail ??
          "Failed to delete campaign."
      );

    } finally {

      setDeletingId(
        null
      );

    }

  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="
      flex-1
      overflow-y-auto
      bg-slate-50
      px-8
      py-6
    ">

      {/* ======================================================
         PAGE HEADER
         ====================================================== */}

      <div className="
        flex
        items-center
        justify-between
      ">

        <div>

          <h1 className="
            text-[22px]
            font-bold
            text-slate-900
          ">
            Campaigns
          </h1>


          <p className="
            mt-1
            text-[13px]
            text-slate-500
          ">
            View and track your communication
            campaigns.
          </p>

        </div>


        {canCreateCampaigns && (

          <button
            type="button"
            onClick={() =>
              setShowForm(
                true
              )
            }
            className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-gradient-to-r
              from-[#7C6CF0]
              to-[#5A3FD6]
              px-4
              py-2.5
              text-[13px]
              font-semibold
              text-white
            "
          >

            <Icon
              path={
                icons.megaphone
              }
              className="h-4 w-4"
            />

            New Campaign

          </button>

        )}

      </div>


      {/* ======================================================
         INFORMATION
         ====================================================== */}

      {!canCreateCampaigns && (

        <div className="
          mt-4
          rounded-xl
          border
          border-blue-100
          bg-blue-50
          px-4
          py-3
        ">

          <p className="
            text-[12.5px]
            text-blue-700
          ">
            You can view campaign details and
            status, but campaign creation is
            restricted to Admins and Campaign
            Managers.
          </p>

        </div>

      )}


      {/* ======================================================
         ERROR
         ====================================================== */}

      {error && (

        <div className="
          mt-3
          rounded-xl
          border
          border-rose-100
          bg-rose-50
          px-4
          py-3
        ">

          <p className="
            text-[12.5px]
            text-rose-600
          ">
            {
              error
            }
          </p>

        </div>

      )}


      {/* ======================================================
         CAMPAIGN LIST
         ====================================================== */}

      <div className="
        mt-5
        space-y-3
      ">

        {loading && (

          <div className="
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-8
            text-center
          ">

            <p className="
              text-[13px]
              text-slate-500
            ">
              Loading campaigns...
            </p>

          </div>

        )}


        {!loading &&
          campaigns.length ===
            0 && (

            <div className="
              rounded-2xl
              border
              border-dashed
              border-slate-200
              bg-white
              p-8
              text-center
            ">

              <p className="
                text-[13px]
                text-slate-500
              ">
                No campaigns available.
              </p>

            </div>

          )}


        {campaigns.map(
          (
            campaign
          ) => {

            const nextOptions =
              ALLOWED_TRANSITIONS[
                campaign.status
              ] ?? [];


            const audience =
              campaign.target_filters
                ?.audience ??
              "General Public";


            const isDeleting =
              deletingId ===
              campaign.id;


            return (
              <div
                key={
                  campaign.id
                }
                onClick={() => {

                  if (
                    !isDeleting
                  ) {

                    setSelectedCampaign(
                      campaign
                    );

                  }

                }}
                className="
                  cursor-pointer
                  rounded-2xl
                  border
                  border-slate-100
                  bg-white
                  p-4
                  shadow-sm
                  transition
                  hover:border-slate-200
                  hover:shadow-md
                "
              >

                <div className="
                  flex
                  items-start
                  justify-between
                  gap-4
                ">

                  {/* ==========================================
                     CAMPAIGN INFORMATION
                     ========================================== */}

                  <div className="
                    min-w-0
                    flex-1
                  ">

                    <div className="
                      flex
                      flex-wrap
                      items-center
                      gap-2.5
                    ">

                      <p className="
                        truncate
                        text-[14.5px]
                        font-semibold
                        text-slate-900
                      ">
                        {
                          campaign.title
                        }
                      </p>


                      <StatusBadge
                        status={
                          campaign.status
                        }
                      />

                    </div>


                    <div className="
                      mt-1
                      flex
                      flex-wrap
                      items-center
                      gap-2
                    ">

                      <span className="
                        text-[12px]
                        capitalize
                        text-slate-500
                      ">
                        {
                          campaign.type
                        }
                      </span>


                      <span className="
                        text-slate-300
                      ">
                        •
                      </span>


                      <span className="
                        text-[12px]
                        text-slate-500
                      ">
                        Audience:{" "}
                        {
                          String(
                            audience
                          )
                        }
                      </span>


                      {campaign.channels?.map(
                        (
                          channel
                        ) => (

                          <span
                            key={
                              channel
                            }
                            className="
                              rounded-full
                              bg-green-50
                              px-2
                              py-0.5
                              text-[10px]
                              font-semibold
                              capitalize
                              text-green-700
                            "
                          >
                            {
                              channel
                            }
                          </span>

                        )
                      )}

                    </div>


                    <p className="
                      mt-2
                      line-clamp-2
                      text-[12px]
                      text-slate-400
                    ">
                      {
                        campaign.content
                      }
                    </p>

                  </div>


                  {/* ==========================================
                     ACTIONS
                     ========================================== */}

                  <div
                    className="
                      flex
                      flex-shrink-0
                      flex-wrap
                      justify-end
                      gap-2
                    "
                    onClick={(
                      e
                    ) =>
                      e.stopPropagation()
                    }
                  >

                    {/* VIEW */}

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCampaign(
                          campaign
                        )
                      }
                      disabled={
                        isDeleting
                      }
                      className="
                        rounded-lg
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-1.5
                        text-[12px]
                        font-medium
                        text-slate-600
                        transition
                        hover:bg-slate-50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      View
                    </button>


                    {/* EDIT */}

                    {canCreateCampaigns && (

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            campaign
                          )
                        }
                        disabled={
                          busyId ===
                            campaign.id ||
                          isDeleting
                        }
                        className="
                          rounded-lg
                          border
                          border-slate-200
                          bg-white
                          px-3
                          py-1.5
                          text-[12px]
                          font-medium
                          text-slate-600
                          transition
                          hover:border-[#6C5CE7]
                          hover:text-[#5A3FD6]
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        Edit
                      </button>

                    )}


                    {/* STATUS TRANSITIONS */}

                    {nextOptions.map(
                      (
                        next
                      ) => (

                        <button
                          key={
                            next
                          }
                          type="button"
                          disabled={
                            busyId ===
                              campaign.id ||
                            isDeleting
                          }
                          onClick={() =>
                            handleTransition(
                              campaign.id,
                              next
                            )
                          }
                          className="
                            rounded-lg
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-1.5
                            text-[12px]
                            font-medium
                            text-slate-600
                            transition
                            hover:border-[#6C5CE7]
                            hover:text-[#5A3FD6]
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          Move to{" "}
                          {
                            STATUS_STYLES[
                              next
                            ]?.label ??
                              next
                          }
                        </button>

                      )
                    )}


                    {/* SEND ALL */}

                    {campaign.status ===
                      "scheduled" && (

                      <button
                        type="button"
                        disabled={
                          busyId ===
                            campaign.id ||
                          isDeleting
                        }
                        onClick={() =>
                          handleSendAll(
                            campaign.id
                          )
                        }
                        className="
                          rounded-lg
                          border
                          border-emerald-200
                          bg-emerald-50
                          px-3
                          py-1.5
                          text-[12px]
                          font-medium
                          text-emerald-700
                          transition
                          hover:border-emerald-300
                          hover:bg-emerald-100
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        {
                          busyId ===
                          campaign.id
                            ? "Sending..."
                            : "Send All"
                        }
                      </button>

                    )}


                    {/* DELETE */}

                    {canCreateCampaigns && (

                      <button
                        type="button"
                        disabled={
                          isDeleting ||
                          busyId ===
                            campaign.id
                        }
                        onClick={() =>
                          void handleDeleteCampaign(
                            campaign
                          )
                        }
                        className="
                          rounded-lg
                          border
                          border-rose-200
                          bg-white
                          px-3
                          py-1.5
                          text-[12px]
                          font-semibold
                          text-rose-600
                          transition
                          hover:bg-rose-50
                          hover:border-rose-300
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        {
                          isDeleting
                            ? "Deleting..."
                            : "Delete"
                        }
                      </button>

                    )}

                  </div>

                </div>

              </div>
            );

          }
        )}

      </div>


      {/* ======================================================
         NEW CAMPAIGN MODAL
         ====================================================== */}

      {showForm &&
        canCreateCampaigns && (

        <NewCampaignForm

          onClose={() =>
            setShowForm(
              false
            )
          }

          onCreated={() => {

            setShowForm(
              false
            );

            void load();

          }}

        />

      )}


      {/* ======================================================
         EDIT CAMPAIGN MODAL
         ====================================================== */}

      {editingCampaign &&
        canCreateCampaigns && (

        <EditCampaignForm

          campaign={
            editingCampaign
          }

          onClose={() =>
            setEditingCampaign(
              null
            )
          }

          onSaved={
            (
              updatedCampaign
            ) => {

              setCampaigns(
                (
                  current
                ) =>
                  current.map(
                    (
                      campaign
                    ) =>
                      campaign.id ===
                      updatedCampaign.id
                        ? updatedCampaign
                        : campaign
                  )
              );


              setEditingCampaign(
                null
              );


              setSelectedCampaign(
                updatedCampaign
              );

            }
          }

        />

      )}


      {/* ======================================================
         DETAILS MODAL
         ====================================================== */}

      {selectedCampaign && (

        <CampaignDetailsModal

          campaign={
            selectedCampaign
          }

          onClose={() =>
            setSelectedCampaign(
              null
            )
          }

        />

      )}

    </div>
  );
}