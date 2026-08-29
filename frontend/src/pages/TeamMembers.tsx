import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchTeamMembers,
  type TeamMember,
} from "../api/users";

import {
  Icon,
  icons,
} from "../components/Icon";


interface TeamMembersProps {
  currentUserEmail: string;
}


/* ============================================================
   INITIALS
   ============================================================ */

function getInitials(
  name: string | null,
  email: string
): string {
  const value =
    name?.trim() ||
    email.trim();

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0).toUpperCase()
    )
    .join("");
}


/* ============================================================
   TEAM MEMBERS PAGE
   ============================================================ */

export default function TeamMembers({
  currentUserEmail,
}: TeamMembersProps) {

  /* ==========================================================
     STATE
     ========================================================== */

  const [members, setMembers] =
    useState<TeamMember[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "all" | "active" | "inactive"
    >("all");


  /* ==========================================================
     LOAD TEAM
     ========================================================== */

  async function loadTeamMembers() {
    setLoading(true);
    setError(null);

    try {

      const response =
        await fetchTeamMembers();

      setMembers(
        response.members ?? []
      );

    } catch (err) {

      console.error(
        "Failed to load team members:",
        err
      );

      setError(
        "Could not load team members."
      );

      setMembers([]);

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {

    void loadTeamMembers();

  }, []);


  /* ==========================================================
     FILTERED MEMBERS
     ========================================================== */

  const filteredMembers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return members.filter(
        (member) => {

          const matchesSearch =
            !query ||
            (member.name ?? "")
              .toLowerCase()
              .includes(query) ||
            member.email
              .toLowerCase()
              .includes(query) ||
            (member.phone ?? "")
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "all" ||
            (
              statusFilter === "active"
                ? member.is_active
                : !member.is_active
            );

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      members,
      search,
      statusFilter,
    ]);


  /* ==========================================================
     COUNTS
     ========================================================== */

  const totalMembers =
    members.length;

  const activeMembers =
    members.filter(
      (member) =>
        member.is_active
    ).length;

  const inactiveMembers =
    members.filter(
      (member) =>
        !member.is_active
    ).length;


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-y-auto bg-slate-50">

      <div className="w-full px-8 py-6">

        {/* ====================================================
           HEADER
           ==================================================== */}

        <div className="flex items-start justify-between gap-4">

          <div>

            <h1 className="text-[22px] font-bold text-slate-900">
              Team Members
            </h1>

            <p className="mt-1 text-[13px] text-slate-500">
              Manage Campaign Persons assigned to your team.
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Signed in as {currentUserEmail}
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              void loadTeamMembers()
            }
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Icon
              path={icons.search}
              className="h-3.5 w-3.5"
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>


        {/* ====================================================
           STAT CARDS
           ==================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

            <p className="text-[11px] font-medium text-slate-500">
              Total Members
            </p>

            <p className="mt-2 text-[25px] font-bold text-slate-900">
              {loading
                ? "..."
                : totalMembers}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Team members assigned to you
            </p>

          </div>


          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

            <p className="text-[11px] font-medium text-slate-500">
              Active Members
            </p>

            <p className="mt-2 text-[25px] font-bold text-emerald-600">
              {loading
                ? "..."
                : activeMembers}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Currently active
            </p>

          </div>


          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

            <p className="text-[11px] font-medium text-slate-500">
              Inactive Members
            </p>

            <p className="mt-2 text-[25px] font-bold text-slate-500">
              {loading
                ? "..."
                : inactiveMembers}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Currently inactive
            </p>

          </div>

        </div>


        {/* ====================================================
           FILTER BAR
           ==================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div className="flex-1">

              <label className="sr-only">
                Search team members
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, email or phone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12px] text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white"
              />

            </div>


            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    "all"
                  )
                }
                className={`rounded-lg px-3.5 py-2 text-[10.5px] font-semibold ${
                  statusFilter === "all"
                    ? "bg-[#6654E9] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>


              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    "active"
                  )
                }
                className={`rounded-lg px-3.5 py-2 text-[10.5px] font-semibold ${
                  statusFilter === "active"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Active
              </button>


              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    "inactive"
                  )
                }
                className={`rounded-lg px-3.5 py-2 text-[10.5px] font-semibold ${
                  statusFilter === "inactive"
                    ? "bg-slate-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Inactive
              </button>

            </div>

          </div>

        </div>


        {/* ====================================================
           ERROR
           ==================================================== */}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">

            <p className="text-[11px] font-medium text-rose-600">
              {error}
            </p>

          </div>
        )}


        {/* ====================================================
           TEAM LIST
           ==================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>

              <p className="text-[14px] font-semibold text-slate-900">
                Your Team
              </p>

              <p className="mt-1 text-[10.5px] text-slate-500">
                Campaign Persons assigned to your manager account.
              </p>

            </div>


            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
              {filteredMembers.length} shown
            </span>

          </div>


          {/* LOADING */}

          {loading && (
            <div className="px-5 py-12 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />

              <p className="mt-3 text-[11px] text-slate-400">
                Loading team members...
              </p>

            </div>
          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            filteredMembers.length ===
              0 && (

              <div className="px-5 py-14 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">

                  <Icon
                    path={icons.users}
                    className="h-6 w-6 text-slate-400"
                  />

                </div>

                <p className="mt-4 text-[13px] font-semibold text-slate-700">
                  No team members found
                </p>

                <p className="mx-auto mt-1 max-w-sm text-[10.5px] leading-5 text-slate-400">
                  {members.length === 0
                    ? "No Campaign Persons are currently assigned to you."
                    : "No members match the current search or status filter."}
                </p>

              </div>
            )}


          {/* MEMBER LIST */}

          {!loading &&
            filteredMembers.length >
              0 && (

              <div className="divide-y divide-slate-100">

                {filteredMembers.map(
                  (member) => (

                    <div
                      key={
                        member.id
                      }
                      className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                    >

                      {/* AVATAR */}

                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
                        {getInitials(
                          member.name,
                          member.email
                        )}
                      </div>


                      {/* MEMBER INFO */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="truncate text-[12.5px] font-semibold text-slate-800">
                            {member.name ??
                              "Unnamed Campaign Person"}
                          </p>

                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[8.5px] font-semibold text-violet-600">
                            Campaign Person
                          </span>

                        </div>

                        <p className="mt-1 truncate text-[10.5px] text-slate-400">
                          {member.email}
                        </p>

                        {member.phone && (
                          <p className="mt-0.5 text-[9.5px] text-slate-400">
                            {member.phone}
                          </p>
                        )}

                      </div>


                      {/* STATUS */}

                      <div className="flex items-center gap-3">

                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                            member.is_active
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {member.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

        </div>


        {/* ====================================================
           INFORMATION
           ==================================================== */}

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

          <p className="text-[11px] font-semibold text-blue-700">
            Team assignment
          </p>

          <p className="mt-1 text-[10.5px] leading-5 text-blue-600">
            This page shows only Campaign Persons assigned to your
            Manager ID. Team assignments are controlled by the
            administrator.
          </p>

        </div>

      </div>

    </div>
  );
}