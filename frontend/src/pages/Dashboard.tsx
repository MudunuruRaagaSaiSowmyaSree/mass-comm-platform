import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

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
  fetchCampaigns,
  type Campaign,
} from "../api/campaign";

import {
  fetchAnalyticsSummary,
  type AnalyticsSummary,
} from "../api/analytics";

import {
  fetchAudience,
  type AudienceMember,
} from "../api/audience";

import {
  apiClient,
} from "../api/client";

import {
  Icon,
  icons,
} from "../components/Icon";


/* ============================================================
   PROPS
   ============================================================ */

interface DashboardProps {
  userEmail: string;

  userRole:
    | "admin"
    | "campaign_manager"
    | "comms_team";
}


/* ============================================================
   MANAGER TEAM RESPONSE
   ============================================================ */

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  registration_date: string | null;
  manager_id: string | null;
}

interface TeamMembersResponse {
  manager_id: string | null;
  total: number;
  members: TeamMember[];
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
  hintClassName = "text-emerald-600",
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  iconBg: string;
  hintClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p className="text-[11px] font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-[25px] font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p
            className={`mt-1 text-[10px] font-medium ${hintClassName}`}
          >
            {hint}
          </p>

        </div>

        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white"
          style={{
            backgroundColor: iconBg,
          }}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}


/* ============================================================
   MINI CARD
   ============================================================ */

function MiniCard({
  label,
  value,
  hint,
  icon,
  bg,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  bg: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <div className="flex items-start gap-2">

        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: bg,
          }}
        >
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-[9px] text-slate-400">
            {label}
          </p>

          <p className="mt-0.5 text-[15px] font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-0.5 text-[8.5px] font-medium text-emerald-600">
            {hint}
          </p>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   STATUS COLORS
   ============================================================ */

const STATUS_COLORS = [
  "#6654E9",
  "#338CF0",
  "#F59E0B",
  "#10B981",
  "#94A3B8",
  "#F43F5E",
];


/* ============================================================
   DASHBOARD
   ============================================================ */

export default function Dashboard({
  userEmail,
  userRole,
}: DashboardProps) {

  /* ==========================================================
     WELCOME NAME
     ========================================================== */

  const greetingName =
    userRole === "admin"
      ? "Admin"
      : userRole === "campaign_manager"
        ? "Manager"
        : "Campaign Person";


  /* ==========================================================
     CAMPAIGNS
     ========================================================== */

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);


  /* ==========================================================
     ANALYTICS
     ========================================================== */

  const [analytics, setAnalytics] =
    useState<AnalyticsSummary | null>(
      null
    );


  /* ==========================================================
     AUDIENCE
     ========================================================== */

  const [audience, setAudience] =
    useState<AudienceMember[]>([]);


  /* ==========================================================
     MANAGER TEAM MEMBERS
     ========================================================== */

  const [
    teamMembers,
    setTeamMembers,
  ] = useState<TeamMember[]>([]);


  const [
    teamMemberCount,
    setTeamMemberCount,
  ] = useState(0);


  /* ==========================================================
     LOADING
     ========================================================== */

  const [loading, setLoading] =
    useState(true);


  /* ==========================================================
     ERROR
     ========================================================== */

  const [error, setError] =
    useState<string | null>(null);


  /* ==========================================================
     LOAD DASHBOARD DATA
     ========================================================== */

  useEffect(() => {

    let cancelled = false;


    async function load() {

      setLoading(true);
      setError(null);


      /*
       * Manager needs:
       * - campaigns
       * - analytics
       * - audience
       * - team members
       *
       * Admin needs:
       * - campaigns
       * - analytics
       * - audience
       *
       * Campaign Person needs:
       * - campaigns
       * - analytics
       * - audience
       */

      const requests: Promise<unknown>[] = [
        fetchCampaigns(),
        fetchAnalyticsSummary(),
        fetchAudience(),
      ];


      if (
        userRole ===
        "campaign_manager"
      ) {

        requests.push(
          apiClient
            .get<TeamMembersResponse>(
              "/users/team-members"
            )
            .then(
              (
                response
              ) =>
                response.data
            )
        );

      }


      const results =
        await Promise.allSettled(
          requests
        );


      if (cancelled) {
        return;
      }


      let failed = false;


      /* ======================================================
         CAMPAIGNS
         ====================================================== */

      const campaignsResult =
        results[0];


      if (
        campaignsResult?.status ===
        "fulfilled"
      ) {

        setCampaigns(
          campaignsResult.value as Campaign[]
        );

      } else {

        failed = true;

        console.error(
          "Campaign loading failed:",
          campaignsResult?.reason
        );

      }


      /* ======================================================
         ANALYTICS
         ====================================================== */

      const analyticsResult =
        results[1];


      if (
        analyticsResult?.status ===
        "fulfilled"
      ) {

        setAnalytics(
          analyticsResult.value as AnalyticsSummary
        );

      } else {

        failed = true;

        console.error(
          "Analytics loading failed:",
          analyticsResult?.reason
        );

      }


      /* ======================================================
         AUDIENCE
         ====================================================== */

      const audienceResult =
        results[2];


      if (
        audienceResult?.status ===
        "fulfilled"
      ) {

        setAudience(
          audienceResult.value as AudienceMember[]
        );

      }


      /* ======================================================
         MANAGER TEAM
         ====================================================== */

      if (
        userRole ===
        "campaign_manager"
      ) {

        const teamResult =
          results[3];


        if (
          teamResult?.status ===
          "fulfilled"
        ) {

          const data =
            teamResult.value as TeamMembersResponse;


          setTeamMembers(
            data.members ?? []
          );


          setTeamMemberCount(
            data.total ?? 0
          );

        } else {

          /*
           * Team loading failure should not
           * destroy the whole dashboard.
           */

          console.error(
            "Team members loading failed:",
            teamResult?.reason
          );

          setTeamMembers([]);
          setTeamMemberCount(0);

        }

      } else {

        setTeamMembers([]);
        setTeamMemberCount(0);

      }


      /* ======================================================
         ERROR MESSAGE
         ====================================================== */

      if (failed) {

        setError(
          "Some dashboard data could not be loaded."
        );

      }


      setLoading(false);
    }


    void load();


    return () => {

      cancelled = true;

    };

  }, [
    userRole,
  ]);


  /* ==========================================================
     TOTAL CAMPAIGNS
     
     IMPORTANT:
     
     Admin:
       Uses global analytics total.
     
     Manager:
       Uses Manager's actual campaigns.
     
     Campaign Person:
       Uses Campaign Person's actual campaigns.
     ========================================================== */

  const totalCampaigns =
    userRole === "admin"
      ? analytics?.total_campaigns ??
        campaigns.length
      : campaigns.length;


  /* ==========================================================
     ACTIVE CAMPAIGNS
     
     Always calculated from the campaigns
     returned for this user.
     ========================================================== */

  const activeCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.status ===
        "sending"
    ).length;


  /* ==========================================================
     PENDING REVIEW
     ========================================================== */

  const pendingReview =
    campaigns.filter(
      (campaign) =>
        campaign.status ===
        "review"
    ).length;


  /* ==========================================================
     AUDIENCE COUNT
     ========================================================== */

  const totalAudience =
    audience.length;


  /* ==========================================================
     DELIVERY RATE
     ========================================================== */

  const deliveryRate =
    analytics?.delivery_rate ??
    0;


  /* ==========================================================
     FAILURE RATE
     ========================================================== */

  const failureRate =
    analytics?.failure_rate ??
    0;


  /* ==========================================================
     SENT
     ========================================================== */

  const sent =
    analytics?.sent ??
    0;


  /* ==========================================================
     DELIVERED
     ========================================================== */

  const delivered =
    analytics?.delivered ??
    0;


  /* ==========================================================
     STATUS COUNTS
     ========================================================== */

  const statusCounts =
    useMemo(() => {

      const counts = {
        draft: 0,
        review: 0,
        scheduled: 0,
        sending: 0,
        completed: 0,
        failed: 0,
      };


      campaigns.forEach(
        (
          campaign
        ) => {

          if (
            campaign.status in
            counts
          ) {

            counts[
              campaign.status as keyof typeof counts
            ] += 1;

          }

        }
      );


      return counts;

    }, [
      campaigns,
    ]);


  /* ==========================================================
     STATUS DATA
     ========================================================== */

  const statusData = [
    {
      name: "Draft",
      value:
        statusCounts.draft,
    },

    {
      name: "In Review",
      value:
        statusCounts.review,
    },

    {
      name: "Scheduled",
      value:
        statusCounts.scheduled,
    },

    {
      name: "Active",
      value:
        statusCounts.sending,
    },

    {
      name: "Completed",
      value:
        statusCounts.completed,
    },

    {
      name: "Failed",
      value:
        statusCounts.failed,
    },
  ];


  /* ==========================================================
     LAST 7 DAYS
     ========================================================== */

  const lastSevenDays =
    useMemo(() => {

      const result: {
        label: string;
        count: number;
      }[] = [];


      const today =
        new Date();


      for (
        let i = 6;
        i >= 0;
        i--
      ) {

        const date =
          new Date(
            today
          );


        date.setDate(
          today.getDate() - i
        );


        const key =
          date
            .toISOString()
            .slice(
              0,
              10
            );


        const count =
          campaigns.filter(
            (
              campaign
            ) =>
              campaign.created_at?.slice(
                0,
                10
              ) === key
          ).length;


        result.push({
          label:
            date.toLocaleDateString(
              "en-US",
              {
                weekday:
                  "short",
              }
            ),

          count,
        });

      }


      return result;

    }, [
      campaigns,
    ]);


  /* ==========================================================
     RECENT CAMPAIGNS
     ========================================================== */

  const recentCampaigns =
    useMemo(() => {

      return [
        ...campaigns,
      ]
        .sort(
          (
            a,
            b
          ) =>
            new Date(
              b.created_at ??
                0
            ).getTime() -
            new Date(
              a.created_at ??
                0
            ).getTime()
        )
        .slice(
          0,
          4
        );

    }, [
      campaigns,
    ]);


  /* ==========================================================
     NAVIGATION
     ========================================================== */

  function navigate(
    view: string
  ) {

    window.dispatchEvent(
      new CustomEvent(
        "navigate-view",
        {
          detail:
            view,
        }
      )
    );

  }


  /* ============================================================
     ADMIN DASHBOARD
     ============================================================ */

  if (
    userRole ===
    "admin"
  ) {

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

        {/* HEADER */}

        <div className="flex items-start justify-between">

          <div>

            <h1 className="text-[22px] font-bold text-slate-900">
              Welcome back,{" "}
              {greetingName} 👋
            </h1>

            <p className="mt-1 text-[12px] text-slate-500">
              Here's an overview of your platform.
            </p>

            {error && (
              <p className="mt-2 text-[11px] text-rose-500">
                {error}
              </p>
            )}

          </div>


          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"
            aria-label={`Notifications for ${userEmail}`}
          >
            <Icon
              path={
                icons.bell
              }
              className="h-4 w-4 text-slate-500"
            />
          </button>

        </div>


        {/* STAT CARDS */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Total Campaigns"
            value={
              loading
                ? "..."
                : String(
                    totalCampaigns
                  )
            }
            hint="All time campaigns"
            icon={
              <Icon
                path={
                  icons.speaker
                }
                className="h-4 w-4"
              />
            }
            iconBg="#6654E9"
          />


          <StatCard
            label="Active Campaigns"
            value={
              loading
                ? "..."
                : String(
                    activeCampaigns
                  )
            }
            hint="Currently running"
            icon={
              <Icon
                path={
                  icons.layout
                }
                className="h-4 w-4"
              />
            }
            iconBg="#10B981"
          />


          <StatCard
            label="Total Users"
            value={
              loading
                ? "..."
                : String(
                    totalAudience
                  )
            }
            hint="Across all roles"
            icon={
              <Icon
                path={
                  icons.users
                }
                className="h-4 w-4"
              />
            }
            iconBg="#338CF0"
          />


          <StatCard
            label="Delivery Rate"
            value={
              loading
                ? "..."
                : `${deliveryRate}%`
            }
            hint={`${failureRate}% failure rate`}
            icon={
              <Icon
                path={
                  icons.shield
                }
                className="h-4 w-4"
              />
            }
            iconBg="#F59E0B"
          />

        </div>


        {/* CHARTS */}

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">

          {/* CAMPAIGNS OVER TIME */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <p className="text-[13.5px] font-semibold text-slate-900">
              Campaigns Over Time
            </p>

            <p className="mt-1 text-[10.5px] text-slate-500">
              Campaigns created during the last 7 days
            </p>


            <div className="mt-4 h-[220px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    lastSevenDays
                  }
                >

                  <CartesianGrid
                    vertical={false}
                    stroke="#EEF2F7"
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#94A3B8",
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fill: "#94A3B8",
                    }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#6555E8"
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


            <p className="mt-2 text-[10px] text-slate-400">
              Total created in this period:{" "}
              {
                lastSevenDays.reduce(
                  (
                    sum,
                    item
                  ) =>
                    sum +
                    item.count,
                  0
                )
              }
            </p>

          </div>


          {/* STATUS */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <p className="text-[13.5px] font-semibold text-slate-900">
              Campaigns by Status
            </p>

            <p className="mt-1 text-[10.5px] text-slate-500">
              Current distribution of campaigns
            </p>


            <div className="mt-3 h-[220px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      statusData
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={
                      55
                    }
                    outerRadius={
                      82
                    }
                    paddingAngle={2}
                  >

                    {statusData.map(
                      (
                        item,
                        index
                      ) => (

                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            STATUS_COLORS[
                              index
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>


            <div className="grid grid-cols-2 gap-x-4 gap-y-2">

              {statusData.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={
                      item.name
                    }
                    className="flex items-center justify-between"
                  >

                    <div className="flex items-center gap-2">

                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[
                              index
                            ],
                        }}
                      />

                      <span className="text-[9.5px] text-slate-500">
                        {
                          item.name
                        }
                      </span>

                    </div>


                    <span className="text-[9.5px] font-semibold text-slate-500">

                      {totalCampaigns >
                      0
                        ? Math.round(
                            (item.value /
                              totalCampaigns) *
                              100
                          )
                        : 0}

                      %

                    </span>

                  </div>

                )
              )}

            </div>

          </div>

        </div>


        {/* ANALYTICS */}

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <p className="text-[13.5px] font-semibold text-slate-900">
              Platform Analytics
            </p>

            <p className="mt-1 text-[10.5px] text-slate-500">
              Key metrics across the platform
            </p>


            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">

              <MiniCard
                label="Total Users"
                value={
                  loading
                    ? "..."
                    : String(
                        totalAudience
                      )
                }
                hint="Audience members"
                icon={
                  <Icon
                    path={
                      icons.users
                    }
                    className="h-4 w-4 text-[#5A3FD6]"
                  />
                }
                bg="#EDE9FE"
              />


              <MiniCard
                label="Campaigns"
                value={
                  loading
                    ? "..."
                    : String(
                        totalCampaigns
                      )
                }
                hint="All time"
                icon={
                  <Icon
                    path={
                      icons.megaphone
                    }
                    className="h-4 w-4 text-emerald-600"
                  />
                }
                bg="#ECFDF5"
              />


              <MiniCard
                label="Messages Sent"
                value={
                  loading
                    ? "..."
                    : String(
                        sent
                      )
                }
                hint="Message delivery"
                icon={
                  <Icon
                    path={
                      icons.speaker
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                }
                bg="#EFF6FF"
              />


              <MiniCard
                label="Avg. Delivery"
                value={
                  loading
                    ? "..."
                    : `${deliveryRate}%`
                }
                hint={`${failureRate}% failed`}
                icon={
                  <Icon
                    path={
                      icons.shield
                    }
                    className="h-4 w-4 text-amber-600"
                  />
                }
                bg="#FFF7ED"
              />

            </div>

          </div>


          {/* RECENT ACTIVITY */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <p className="text-[13.5px] font-semibold text-slate-900">
              Recent Activity
            </p>

            <p className="mt-1 text-[10.5px] text-slate-500">
              Latest platform activities
            </p>


            <div className="mt-4 space-y-3">

              {recentCampaigns.length ===
              0 ? (

                <p className="text-[11px] text-slate-400">
                  No recent activity.
                </p>

              ) : (

                recentCampaigns.map(
                  (
                    campaign
                  ) => (

                    <button
                      key={
                        campaign.id
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          "campaigns"
                        )
                      }
                      className="flex w-full items-start gap-3 text-left"
                    >

                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">

                        <Icon
                          path={
                            icons.megaphone
                          }
                          className="h-3.5 w-3.5 text-violet-600"
                        />

                      </div>


                      <div className="min-w-0 flex-1">

                        <p className="truncate text-[10.5px] font-semibold text-slate-700">
                          {
                            campaign.title
                          }
                        </p>

                        <p className="mt-0.5 truncate text-[9.5px] text-slate-400">
                          Campaign status:{" "}
                          {
                            campaign.status
                          }
                        </p>

                      </div>

                    </button>

                  )
                )

              )}

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "campaigns"
                )
              }
              className="mt-4 text-[9.5px] font-semibold text-[#5A3FD6]"
            >
              View all activity
            </button>

          </div>

        </div>

      </div>
    );
  }


  /* ============================================================
     MANAGER DASHBOARD
     ============================================================ */

  if (
    userRole ===
    "campaign_manager"
  ) {

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

        {/* HEADER */}

        <div>

          <h1 className="text-[22px] font-bold text-slate-900">
            Welcome back,{" "}
            {greetingName} 👋
          </h1>

          <p className="mt-1 text-[12px] text-slate-500">
            Here's what's happening with your campaigns.
          </p>

        </div>


        {/* STAT CARDS */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            label="My Campaigns"
            value={
              loading
                ? "..."
                : String(
                    totalCampaigns
                  )
            }
            hint="Total campaigns"
            icon={
              <Icon
                path={
                  icons.megaphone
                }
                className="h-4 w-4"
              />
            }
            iconBg="#6654E9"
          />


          <StatCard
            label="Active Campaigns"
            value={
              loading
                ? "..."
                : String(
                    activeCampaigns
                  )
            }
            hint="Currently running"
            icon={
              <Icon
                path={
                  icons.layout
                }
                className="h-4 w-4"
              />
            }
            iconBg="#10B981"
          />


          <StatCard
            label="Pending Review"
            value={
              loading
                ? "..."
                : String(
                    pendingReview
                  )
            }
            hint="Awaiting your review"
            hintClassName="text-amber-600"
            icon={
              <Icon
                path={
                  icons.clock
                }
                className="h-4 w-4"
              />
            }
            iconBg="#F59E0B"
          />


          <StatCard
            label="Avg. Delivery Rate"
            value={
              loading
                ? "..."
                : `${deliveryRate}%`
            }
            hint="Current delivery rate"
            icon={
              <Icon
                path={
                  icons.chart
                }
                className="h-4 w-4"
              />
            }
            iconBg="#338CF0"
          />


          {/* IMPORTANT:
             This now uses actual Manager team members,
             NOT audience.length.
          */}

          <StatCard
            label="Team Members"
            value={
              loading
                ? "..."
                : String(
                    teamMemberCount
                  )
            }
            hint={
              teamMemberCount === 1
                ? "1 member assigned"
                : `${teamMemberCount} members assigned`
            }
            icon={
              <Icon
                path={
                  icons.users
                }
                className="h-4 w-4"
              />
            }
            iconBg="#8B5CF6"
          />

        </div>


        {/* PERFORMANCE + STATUS */}

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">

          {/* PERFORMANCE */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[13.5px] font-semibold text-slate-900">
                  Campaigns Performance
                </p>

                <p className="mt-1 text-[10.5px] text-slate-500">
                  Overview of your campaign performance
                </p>

              </div>


              <select className="rounded-lg border border-slate-200 px-2 py-1.5 text-[9px] text-slate-500">

                <option>
                  Last 7 Days
                </option>

                <option>
                  Last 30 Days
                </option>

              </select>

            </div>


            <div className="mt-4 h-[220px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    lastSevenDays
                  }
                >

                  <CartesianGrid
                    vertical={false}
                    stroke="#EEF2F7"
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#94A3B8",
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fill: "#94A3B8",
                    }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#6555E8"
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

          </div>


          {/* STATUS */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <p className="text-[13.5px] font-semibold text-slate-900">
              Campaigns by Status
            </p>

            <p className="mt-1 text-[10.5px] text-slate-500">
              Distribution for your campaigns
            </p>


            <div className="mt-3 h-[220px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      statusData
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={
                      52
                    }
                    outerRadius={
                      78
                    }
                    paddingAngle={2}
                  >

                    {statusData.map(
                      (
                        item,
                        index
                      ) => (

                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            STATUS_COLORS[
                              index
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>


        {/* MY CAMPAIGNS + TEAM OVERVIEW */}

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">

          {/* MY CAMPAIGNS */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[13.5px] font-semibold text-slate-900">
                  My Campaigns
                </p>

                <p className="mt-1 text-[10.5px] text-slate-500">
                  Your recent campaigns
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "campaigns"
                  )
                }
                className="rounded-lg bg-[#6654E9] px-3 py-1.5 text-[9.5px] font-semibold text-white"
              >
                View All
              </button>

            </div>


            <div className="mt-4 divide-y divide-slate-100">

              {recentCampaigns.length ===
              0 ? (

                <p className="py-6 text-center text-[11px] text-slate-400">
                  No campaigns available.
                </p>

              ) : (

                recentCampaigns.map(
                  (
                    campaign
                  ) => (

                    <button
                      key={
                        campaign.id
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          "campaigns"
                        )
                      }
                      className="grid w-full grid-cols-[1.5fr_.7fr_.8fr_.6fr] items-center gap-3 py-3 text-left"
                    >

                      <span className="truncate text-[10.5px] font-semibold text-slate-700">
                        {
                          campaign.title
                        }
                      </span>


                      <span className="truncate text-[9px] capitalize text-slate-500">
                        {
                          campaign.type
                        }
                      </span>


                      <span className="truncate text-[9px] capitalize text-slate-500">
                        {
                          campaign.status
                        }
                      </span>


                      <span className="text-right text-[9px] text-slate-400">

                        {campaign.created_at
                          ? new Date(
                              campaign.created_at
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month:
                                  "short",

                                day:
                                  "numeric",
                              }
                            )
                          : "—"}

                      </span>

                    </button>

                  )
                )

              )}

            </div>

          </div>


          {/* TEAM OVERVIEW */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[13.5px] font-semibold text-slate-900">
                  Team Overview
                </p>

                <p className="mt-1 text-[10.5px] text-slate-500">
                  Campaign Persons assigned to you
                </p>

              </div>


              {teamMemberCount >
                0 && (

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "teamMembers"
                    )
                  }
                  className="text-[9.5px] font-semibold text-[#5A3FD6]"
                >
                  View All
                </button>

              )}

            </div>


            <div className="mt-4 space-y-3">

              {teamMembers.length ===
              0 ? (

                <div className="py-6 text-center">

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">

                    <Icon
                      path={
                        icons.users
                      }
                      className="h-5 w-5 text-violet-500"
                    />

                  </div>

                  <p className="mt-3 text-[11px] font-medium text-slate-600">
                    No team members assigned
                  </p>

                  <p className="mt-1 text-[9px] text-slate-400">
                    Assign Campaign Persons from Team Members.
                  </p>

                </div>

              ) : (

                teamMembers
                  .slice(
                    0,
                    4
                  )
                  .map(
                    (
                      member
                    ) => (

                      <div
                        key={
                          member.id
                        }
                        className="flex items-center gap-3"
                      >

                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">

                          {(
                            member.name ??
                            member.email
                          )
                            .charAt(
                              0
                            )
                            .toUpperCase()}

                        </div>


                        <div className="min-w-0 flex-1">

                          <p className="truncate text-[10px] font-semibold text-slate-700">
                            {
                              member.name ??
                              "Campaign Person"
                            }
                          </p>

                          <p className="truncate text-[8.5px] text-slate-400">
                            {
                              member.email
                            }
                          </p>

                        </div>


                        <span
                          className={
                            member.is_active
                              ? "rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-600"
                              : "rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500"
                          }
                        >
                          {member.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                    )
                  )

              )}

            </div>

          </div>

        </div>

      </div>
    );
  }


  /* ============================================================
     CAMPAIGN PERSON DASHBOARD
     ============================================================ */

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

      {/* HEADER */}

      <div>

        <h1 className="text-[22px] font-bold text-slate-900">
          Welcome back,{" "}
          {greetingName} 👋
        </h1>

        <p className="mt-1 text-[12px] text-slate-500">
          Here's your workspace for today.
        </p>

      </div>


      {/* STAT CARDS */}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

        <StatCard
          label="My Assignments"
          value={
            loading
              ? "..."
              : String(
                  campaigns.length
                )
          }
          hint="Total tasks"
          icon={
            <Icon
              path={
                icons.layout
              }
              className="h-4 w-4"
            />
          }
          iconBg="#6654E9"
        />


        <StatCard
          label="Pending Tasks"
          value={
            loading
              ? "..."
              : String(
                  pendingReview
                )
          }
          hint="Need your attention"
          hintClassName="text-amber-600"
          icon={
            <Icon
              path={
                icons.clock
              }
              className="h-4 w-4"
            />
          }
          iconBg="#F59E0B"
        />


        <StatCard
          label="In Progress"
          value={
            loading
              ? "..."
              : String(
                  activeCampaigns
                )
          }
          hint="Tasks you're working on"
          icon={
            <Icon
              path={
                icons.chart
              }
              className="h-4 w-4"
            />
          }
          iconBg="#338CF0"
        />


        <StatCard
          label="Submitted"
          value={
            loading
              ? "..."
              : String(
                  sent
                )
          }
          hint="Messages sent"
          icon={
            <Icon
              path={
                icons.megaphone
              }
              className="h-4 w-4"
            />
          }
          iconBg="#10B981"
        />


        <StatCard
          label="Approved"
          value={
            loading
              ? "..."
              : String(
                  delivered
                )
          }
          hint="Delivered"
          icon={
            <Icon
              path={
                icons.shield
              }
              className="h-4 w-4"
            />
          }
          iconBg="#10B981"
        />

      </div>


      {/* TASKS / STATUS / ACTIVITY */}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_.9fr_.9fr]">

        {/* MY TASKS */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[13.5px] font-semibold text-slate-900">
                My Tasks
              </p>

              <p className="mt-1 text-[10.5px] text-slate-500">
                Your assigned tasks
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "campaigns"
                )
              }
              className="text-[9.5px] font-semibold text-[#5A3FD6]"
            >
              View All
            </button>

          </div>


          <div className="mt-4 space-y-3">

            {recentCampaigns.length ===
            0 ? (

              <p className="py-8 text-center text-[11px] text-slate-400">
                No assigned tasks.
              </p>

            ) : (

              recentCampaigns.map(
                (
                  campaign
                ) => (

                  <button
                    key={
                      campaign.id
                    }
                    type="button"
                    onClick={() =>
                      navigate(
                        "campaigns"
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
                  >

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">

                      <Icon
                        path={
                          icons.layout
                        }
                        className="h-3.5 w-3.5 text-violet-600"
                      />

                    </div>


                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[10.5px] font-semibold text-slate-700">
                        {
                          campaign.title
                        }
                      </p>

                      <p className="mt-0.5 text-[9px] text-slate-400">
                        {
                          campaign.status
                        }
                      </p>

                    </div>

                  </button>

                )
              )

            )}

          </div>

        </div>


        {/* TASKS BY STATUS */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <p className="text-[13.5px] font-semibold text-slate-900">
            Tasks by Status
          </p>

          <p className="mt-1 text-[10.5px] text-slate-500">
            Overview of your task status
          </p>


          <div className="mt-4 h-[190px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={
                    statusData
                  }
                  dataKey="value"
                  nameKey="name"
                  innerRadius={
                    48
                  }
                  outerRadius={
                    70
                  }
                  paddingAngle={2}
                >

                  {statusData.map(
                    (
                      item,
                      index
                    ) => (

                      <Cell
                        key={
                          item.name
                        }
                        fill={
                          STATUS_COLORS[
                            index
                          ]
                        }
                      />

                    )
                  )}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* RECENT ACTIVITY */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <p className="text-[13.5px] font-semibold text-slate-900">
            Recent Activity
          </p>

          <p className="mt-1 text-[10.5px] text-slate-500">
            Your recent activities
          </p>


          <div className="mt-4 space-y-3">

            {recentCampaigns
              .slice(
                0,
                4
              )
              .map(
                (
                  campaign
                ) => (

                  <div
                    key={
                      campaign.id
                    }
                    className="flex items-start gap-3"
                  >

                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">

                      <Icon
                        path={
                          icons.chart
                        }
                        className="h-3.5 w-3.5 text-violet-600"
                      />

                    </div>


                    <div className="min-w-0">

                      <p className="truncate text-[10px] font-semibold text-slate-700">
                        {
                          campaign.title
                        }
                      </p>

                      <p className="truncate text-[9px] text-slate-400">
                        Status:{" "}
                        {
                          campaign.status
                        }
                      </p>

                    </div>

                  </div>

                )
              )}

          </div>

        </div>

      </div>


      {/* QUICK ACTIONS */}

      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <p className="text-[13.5px] font-semibold text-slate-900">
          Quick Actions
        </p>

        <p className="mt-1 text-[10.5px] text-slate-500">
          Common actions to help you work faster.
        </p>


        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">

          {/* GENERATE CONTENT */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "aiStudio"
              )
            }
            className="rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
          >

            <Icon
              path={
                icons.sparkle
              }
              className="h-4 w-4 text-violet-600"
            />

            <p className="mt-2 text-[10px] font-semibold text-slate-700">
              Generate Content
            </p>

            <p className="mt-0.5 text-[8.5px] text-slate-400">
              Create AI content
            </p>

          </button>


          {/* TRANSLATE CONTENT */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "translations"
              )
            }
            className="rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
          >

            <Icon
              path={
                icons.globe
              }
              className="h-4 w-4 text-emerald-600"
            />

            <p className="mt-2 text-[10px] font-semibold text-slate-700">
              Translate Content
            </p>

            <p className="mt-0.5 text-[8.5px] text-slate-400">
              Multi-language translation
            </p>

          </button>


          {/* TONE CHECK */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "review"
              )
            }
            className="rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
          >

            <Icon
              path={
                icons.clock
              }
              className="h-4 w-4 text-orange-500"
            />

            <p className="mt-2 text-[10px] font-semibold text-slate-700">
              Tone Check
            </p>

            <p className="mt-0.5 text-[8.5px] text-slate-400">
              Check content tone
            </p>

          </button>


          {/* COMPLIANCE */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "compliance"
              )
            }
            className="rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
          >

            <Icon
              path={
                icons.shield
              }
              className="h-4 w-4 text-rose-500"
            />

            <p className="mt-2 text-[10px] font-semibold text-slate-700">
              Compliance Check
            </p>

            <p className="mt-0.5 text-[8.5px] text-slate-400">
              Verify compliance
            </p>

          </button>


          {/* TEMPLATES */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "templates"
              )
            }
            className="rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
          >

            <Icon
              path={
                icons.layout
              }
              className="h-4 w-4 text-violet-600"
            />

            <p className="mt-2 text-[10px] font-semibold text-slate-700">
              View Templates
            </p>

            <p className="mt-0.5 text-[8.5px] text-slate-400">
              Browse templates
            </p>

          </button>

        </div>

      </div>

    </div>
  );
}