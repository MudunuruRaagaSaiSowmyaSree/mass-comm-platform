import React, { useEffect, useState } from "react";
import {
  apiClient,
  getAuthToken,
} from "../api/client";

interface AudienceMember {
  id: string;
  name: string;
  language: string;
  geography: string;
  occupation: string;
}

interface AudienceManagerProps {
  currentUser?: string;
}

export default function AudienceManager({
  currentUser = "Raaga Sai",
}: AudienceManagerProps) {
  const [members, setMembers] = useState<
    AudienceMember[]
  >([]);

  const [name, setName] = useState("");
  const [language, setLanguage] =
    useState("");
  const [geography, setGeography] =
    useState("");
  const [occupation, setOccupation] =
    useState("");

  const [filterLang, setFilterLang] =
    useState("");
  const [filterGeo, setFilterGeo] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [adding, setAdding] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  /* -------------------------------------------------------------- */
  /* Fetch audience                                                 */
  /* -------------------------------------------------------------- */

  async function fetchAudience() {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      if (!token) {
        setError(
          "Your login session is not authenticated. Please log in again."
        );
        return;
      }

      const response =
        await apiClient.get<AudienceMember[]>(
          "/audience/"
        );

      setMembers(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "Failed to fetch audience:",
        err
      );

      const status =
        err?.response?.status;

      const detail =
        err?.response?.data?.detail;

      if (status === 401) {
        setError(
          "Your login session is not authenticated or has expired. Please log in again."
        );
      } else if (status === 403) {
        setError(
          typeof detail === "string"
            ? detail
            : "You do not have permission to view the audience."
        );
      } else if (
        typeof detail === "string"
      ) {
        setError(detail);
      } else {
        setError(
          "Failed to load audience members."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------------- */
  /* Initial load                                                   */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    void fetchAudience();
  }, []);

  /* -------------------------------------------------------------- */
  /* Add member                                                     */
  /* -------------------------------------------------------------- */

  async function handleAddMember(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    const cleanName = name.trim();
    const cleanLanguage =
      language.trim().toLowerCase();
    const cleanGeography =
      geography.trim();
    const cleanOccupation =
      occupation.trim();

    if (!cleanName) {
      setError("Please enter the member name.");
      return;
    }

    if (!cleanLanguage) {
      setError(
        "Please enter the language code."
      );
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setError(
        "Your login session is not authenticated. Please log in again."
      );
      return;
    }

    setAdding(true);

    try {
      const response =
        await apiClient.post<AudienceMember>(
          "/audience/",
          {
            name: cleanName,
            language: cleanLanguage,
            geography:
              cleanGeography || "General",
            occupation:
              cleanOccupation || "General",
          }
        );

      /*
       * Reset form only after the backend successfully
       * accepts the member.
       */
      setName("");
      setLanguage("");
      setGeography("");
      setOccupation("");

      setSuccess(
        `${response.data?.name ?? cleanName} was added successfully.`
      );

      /*
       * Reload from backend so the table contains
       * the actual database record and ID.
       */
      await fetchAudience();
    } catch (err: any) {
      console.error(
        "Failed to add member:",
        err
      );

      const status =
        err?.response?.status;

      const detail =
        err?.response?.data?.detail;

      if (status === 401) {
        setError(
          "Your login session is not authenticated or has expired. Please log in again."
        );
      } else if (status === 403) {
        setError(
          typeof detail === "string"
            ? detail
            : "You do not have permission to add audience members."
        );
      } else if (
        typeof detail === "string"
      ) {
        setError(detail);
      } else if (
        err?.response?.data
      ) {
        setError(
          "The server rejected the audience member. Please check the entered values."
        );
      } else {
        setError(
          "Failed to add audience member. Please make sure the backend is running."
        );
      }
    } finally {
      setAdding(false);
    }
  }

  /* -------------------------------------------------------------- */
  /* Delete member                                                  */
  /* -------------------------------------------------------------- */

  async function handleDelete(
    id: string
  ) {
    setError(null);
    setSuccess(null);

    const token = getAuthToken();

    if (!token) {
      setError(
        "Your login session is not authenticated. Please log in again."
      );
      return;
    }

    setDeletingId(id);

    try {
      await apiClient.delete(
        `/audience/${id}`
      );

      setSuccess(
        "Audience member deleted successfully."
      );

      await fetchAudience();
    } catch (err: any) {
      console.error(
        "Failed to delete member:",
        err
      );

      const status =
        err?.response?.status;

      const detail =
        err?.response?.data?.detail;

      if (status === 401) {
        setError(
          "Your login session is not authenticated or has expired. Please log in again."
        );
      } else if (status === 403) {
        setError(
          typeof detail === "string"
            ? detail
            : "You do not have permission to delete audience members."
        );
      } else if (
        typeof detail === "string"
      ) {
        setError(detail);
      } else {
        setError(
          "Failed to delete audience member."
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  /* -------------------------------------------------------------- */
  /* Filtering                                                      */
  /* -------------------------------------------------------------- */

  const filteredMembers =
    members.filter((member) => {
      const matchesLang = filterLang
        ? member.language
            .toLowerCase()
            .includes(
              filterLang
                .trim()
                .toLowerCase()
            )
        : true;

      const matchesGeo = filterGeo
        ? member.geography
            .toLowerCase()
            .includes(
              filterGeo
                .trim()
                .toLowerCase()
            )
        : true;

      return matchesLang && matchesGeo;
    });

  /* -------------------------------------------------------------- */
  /* Render                                                         */
  /* -------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 rounded-3xl border-l-8 border-indigo-600 bg-white p-8 shadow-xl md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">
              Audience Manager
            </h1>

            <p className="mt-2 max-w-xl text-base text-slate-600">
              Welcome back,{" "}
              <span className="font-semibold text-indigo-600">
                {currentUser}
              </span>
              ! Segment your audience for
              targeted, multilingual mass
              communication workflows.
            </p>
          </div>

          <div>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-inner">
              Total Members:{" "}
              {members.length}
            </span>
          </div>
        </div>

        {/* Global messages */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Add member */}
          <div className="flex flex-col space-y-6 rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl lg:col-span-1">
            <div className="border-b border-indigo-50 pb-4">
              <h2 className="text-2xl font-bold text-slate-950">
                Add Member
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Populate your audience base.
              </p>
            </div>

            <form
              onSubmit={handleAddMember}
              className="space-y-5"
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Language Code
                </label>

                <input
                  type="text"
                  placeholder="e.g. hi, te, en"
                  value={language}
                  onChange={(e) =>
                    setLanguage(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Example: en, hi, te, ta, bn
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Geography
                </label>

                <input
                  type="text"
                  placeholder="e.g. Bihar, Telangana"
                  value={geography}
                  onChange={(e) =>
                    setGeography(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Occupation
                </label>

                <input
                  type="text"
                  placeholder="e.g. Farmer, Teacher"
                  value={occupation}
                  onChange={(e) =>
                    setOccupation(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding
                  ? "Adding Member..."
                  : "+ Add Member"}
              </button>
            </form>
          </div>

          {/* Members table */}
          <div className="space-y-6 rounded-3xl border border-blue-100 bg-white p-8 shadow-xl lg:col-span-3">
            <div className="flex flex-col items-center justify-between gap-4 border-b border-blue-50 pb-6 sm:flex-row">
              <h2 className="text-2xl font-bold text-slate-950">
                Segments
              </h2>

              <div className="flex w-full gap-3 sm:w-auto">
                <input
                  type="text"
                  placeholder="Filter Language..."
                  value={filterLang}
                  onChange={(e) =>
                    setFilterLang(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
                />

                <input
                  type="text"
                  placeholder="Filter Region..."
                  value={filterGeo}
                  onChange={(e) =>
                    setFilterGeo(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-blue-100 text-xs font-bold uppercase tracking-widest text-blue-900">
                    <th className="px-5 py-4">
                      Name
                    </th>

                    <th className="px-5 py-4">
                      Language
                    </th>

                    <th className="px-5 py-4">
                      Geography
                    </th>

                    <th className="px-5 py-4">
                      Occupation
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-50/50 text-sm">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-blue-900"
                      >
                        Loading audience
                        members...
                      </td>
                    </tr>
                  ) : filteredMembers.length >
                    0 ? (
                    filteredMembers.map(
                      (member) => (
                        <tr
                          key={member.id}
                          className="transition hover:bg-blue-50/50"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-950">
                            {member.name}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg border border-blue-200 bg-blue-100 px-3.5 py-1.5 text-xs font-bold uppercase text-blue-800 shadow-sm">
                              {member.language}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {member.geography ||
                              "General"}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {member.occupation ||
                              "General"}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  member.id
                                )
                              }
                              disabled={
                                deletingId ===
                                member.id
                              }
                              className="rounded-lg border border-amber-200 bg-amber-100 px-4 py-2 text-xs font-bold text-amber-900 shadow-sm transition-all hover:bg-amber-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId ===
                              member.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-base font-medium text-blue-900"
                      >
                        No members found.
                        Try adjusting your
                        filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}