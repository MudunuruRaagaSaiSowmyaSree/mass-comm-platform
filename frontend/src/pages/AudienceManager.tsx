import React, {
  useEffect,
  useState,
} from "react";

import {
  apiClient,
  getAuthToken,
} from "../api/client";


/* ============================================================
   TYPES
   ============================================================ */

interface AudienceMember {
  id: string;

  name: string;

  language: string;

  geography: string | null;

  occupation: string | null;

  email: string | null;

  phone: string | null;

  org_id: string | null;

  engagement_score: number;

  last_contacted_at: string | null;
}


interface AudienceMemberPayload {
  name: string;

  language: string;

  geography: string;

  occupation: string;

  email: string;

  phone: string;
}


interface AudienceManagerProps {
  currentUser?: string;
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function AudienceManager({
  currentUser = "Raaga Sai",
}: AudienceManagerProps) {

  /* ==========================================================
     AUDIENCE DATA
     ========================================================== */

  const [
    members,
    setMembers,
  ] = useState<AudienceMember[]>([]);


  /* ==========================================================
     ADD MEMBER FORM
     ========================================================== */

  const [
    name,
    setName,
  ] = useState("");

  const [
    language,
    setLanguage,
  ] = useState("");

  const [
    geography,
    setGeography,
  ] = useState("");

  const [
    occupation,
    setOccupation,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");


  /* ==========================================================
     EDIT MEMBER
     ========================================================== */

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(null);

  const [
    editName,
    setEditName,
  ] = useState("");

  const [
    editLanguage,
    setEditLanguage,
  ] = useState("");

  const [
    editGeography,
    setEditGeography,
  ] = useState("");

  const [
    editOccupation,
    setEditOccupation,
  ] = useState("");

  const [
    editEmail,
    setEditEmail,
  ] = useState("");

  const [
    editPhone,
    setEditPhone,
  ] = useState("");

  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false);


  /* ==========================================================
     SEGMENT FILTERS
     ========================================================== */

  const [
    filterLang,
    setFilterLang,
  ] = useState("");

  const [
    filterGeo,
    setFilterGeo,
  ] = useState("");

  const [
    filterOccupation,
    setFilterOccupation,
  ] = useState("");

  const [
    filterMinEngagement,
    setFilterMinEngagement,
  ] = useState("");

  const [
    filterMaxEngagement,
    setFilterMaxEngagement,
  ] = useState("");


  /* ==========================================================
     UI STATE
     ========================================================== */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    adding,
    setAdding,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    success,
    setSuccess,
  ] = useState<string | null>(null);


  /* ==========================================================
     FETCH AUDIENCE
     ========================================================== */

  async function fetchAudience() {

    setLoading(true);
    setError(null);

    try {

      const token =
        getAuthToken();

      if (!token) {

        setError(
          "Your login session is not authenticated. Please log in again."
        );

        return;
      }


      const response =
        await apiClient.get<
          AudienceMember[]
        >(
          "/audience/"
        );


      setMembers(
        Array.isArray(
          response.data
        )
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

      } else if (
        status === 403
      ) {

        setError(
          typeof detail ===
            "string"
            ? detail
            : "You do not have permission to view the audience."
        );

      } else if (
        typeof detail ===
        "string"
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


  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {

    void fetchAudience();

  }, []);


  /* ==========================================================
     RESET ADD FORM
     ========================================================== */

  function resetAddForm() {

    setName("");
    setLanguage("");
    setGeography("");
    setOccupation("");
    setEmail("");
    setPhone("");
  }


  /* ==========================================================
     ADD MEMBER
     ========================================================== */

  async function handleAddMember(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setError(null);
    setSuccess(null);


    const cleanName =
      name.trim();

    const cleanLanguage =
      language
        .trim()
        .toLowerCase();

    const cleanGeography =
      geography.trim();

    const cleanOccupation =
      occupation.trim();

    const cleanEmail =
      email.trim();

    const cleanPhone =
      phone.trim();


    /* --------------------------------------------------------
       VALIDATION
       -------------------------------------------------------- */

    if (!cleanName) {

      setError(
        "Please enter the member name."
      );

      return;
    }


    if (!cleanLanguage) {

      setError(
        "Please enter the language code."
      );

      return;
    }


    /*
     * Email and phone are optional individually,
     * but at least one contact method should exist.
     */

    if (
      !cleanEmail &&
      !cleanPhone
    ) {

      setError(
        "Please provide at least an email address or phone number."
      );

      return;
    }


    /* Email validation */

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {

      setError(
        "Please enter a valid email address."
      );

      return;
    }


    const token =
      getAuthToken();


    if (!token) {

      setError(
        "Your login session is not authenticated. Please log in again."
      );

      return;
    }


    setAdding(true);


    try {

      const payload:
        AudienceMemberPayload = {

        name:
          cleanName,

        language:
          cleanLanguage,

        geography:
          cleanGeography ||
          "General",

        occupation:
          cleanOccupation ||
          "General",

        email:
          cleanEmail,

        phone:
          cleanPhone,
      };


      const response =
        await apiClient.post<
          AudienceMember
        >(
          "/audience/",
          payload
        );


      resetAddForm();


      setSuccess(
        `${
          response.data?.name ??
          cleanName
        } was added successfully.`
      );


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

      } else if (
        status === 403
      ) {

        setError(
          typeof detail ===
            "string"
            ? detail
            : "You do not have permission to add audience members."
        );

      } else if (
        typeof detail ===
        "string"
      ) {

        setError(detail);

      } else {

        setError(
          "Failed to add audience member. Please make sure the backend is running."
        );
      }

    } finally {

      setAdding(false);
    }
  }


  /* ==========================================================
     START EDIT
     ========================================================== */

  function startEdit(
    member: AudienceMember
  ) {

    setError(null);
    setSuccess(null);


    setEditingId(
      member.id
    );


    setEditName(
      member.name ?? ""
    );

    setEditLanguage(
      member.language ?? ""
    );

    setEditGeography(
      member.geography ?? ""
    );

    setEditOccupation(
      member.occupation ?? ""
    );

    setEditEmail(
      member.email ?? ""
    );

    setEditPhone(
      member.phone ?? ""
    );
  }


  /* ==========================================================
     CANCEL EDIT
     ========================================================== */

  function cancelEdit() {

    setEditingId(null);

    setEditName("");
    setEditLanguage("");
    setEditGeography("");
    setEditOccupation("");
    setEditEmail("");
    setEditPhone("");
  }


  /* ==========================================================
     SAVE EDIT
     ========================================================== */

  async function handleSaveEdit(
    id: string
  ) {

    setError(null);
    setSuccess(null);


    const cleanName =
      editName.trim();

    const cleanLanguage =
      editLanguage
        .trim()
        .toLowerCase();

    const cleanGeography =
      editGeography.trim();

    const cleanOccupation =
      editOccupation.trim();

    const cleanEmail =
      editEmail.trim();

    const cleanPhone =
      editPhone.trim();


    /* --------------------------------------------------------
       VALIDATION
       -------------------------------------------------------- */

    if (!cleanName) {

      setError(
        "Please enter the member name."
      );

      return;
    }


    if (!cleanLanguage) {

      setError(
        "Please enter the language code."
      );

      return;
    }


    if (
      !cleanEmail &&
      !cleanPhone
    ) {

      setError(
        "Please provide at least an email address or phone number."
      );

      return;
    }


    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {

      setError(
        "Please enter a valid email address."
      );

      return;
    }


    const token =
      getAuthToken();


    if (!token) {

      setError(
        "Your login session is not authenticated. Please log in again."
      );

      return;
    }


    setSavingEdit(true);


    try {

      const payload:
        AudienceMemberPayload = {

        name:
          cleanName,

        language:
          cleanLanguage,

        geography:
          cleanGeography ||
          "General",

        occupation:
          cleanOccupation ||
          "General",

        email:
          cleanEmail,

        phone:
          cleanPhone,
      };


      await apiClient.patch(
        `/audience/${id}`,
        payload
      );


      setSuccess(
        "Audience member updated successfully."
      );


      cancelEdit();


      await fetchAudience();

    } catch (err: any) {

      console.error(
        "Failed to update member:",
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

      } else if (
        status === 403
      ) {

        setError(
          typeof detail ===
            "string"
            ? detail
            : "You do not have permission to edit audience members."
        );

      } else if (
        status === 404
      ) {

        setError(
          "Audience member was not found."
        );

      } else if (
        typeof detail ===
        "string"
      ) {

        setError(detail);

      } else {

        setError(
          "Failed to update audience member."
        );
      }

    } finally {

      setSavingEdit(false);
    }
  }


  /* ==========================================================
     DELETE MEMBER
     ========================================================== */

  async function handleDelete(
    id: string
  ) {

    setError(null);
    setSuccess(null);


    const token =
      getAuthToken();


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

      } else if (
        status === 403
      ) {

        setError(
          typeof detail ===
            "string"
            ? detail
            : "You do not have permission to delete audience members."
        );

      } else if (
        typeof detail ===
        "string"
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


  /* ==========================================================
     FRONTEND SEGMENTATION
     ========================================================== */

  const filteredMembers =
    members.filter(
      (member) => {

        /* Language */

        const matchesLang =
          filterLang
            ? member.language
                .toLowerCase()
                .includes(
                  filterLang
                    .trim()
                    .toLowerCase()
                )
            : true;


        /* Geography */

        const matchesGeo =
          filterGeo
            ? (
                member.geography ??
                ""
              )
                .toLowerCase()
                .includes(
                  filterGeo
                    .trim()
                    .toLowerCase()
                )
            : true;


        /* Occupation */

        const matchesOccupation =
          filterOccupation
            ? (
                member.occupation ??
                ""
              )
                .toLowerCase()
                .includes(
                  filterOccupation
                    .trim()
                    .toLowerCase()
                )
            : true;


        /* Minimum engagement */

        const minEngagement =
          filterMinEngagement !== ""
            ? Number(
                filterMinEngagement
              )
            : null;


        const matchesMinEngagement =
          minEngagement ===
            null ||
          member.engagement_score >=
            minEngagement;


        /* Maximum engagement */

        const maxEngagement =
          filterMaxEngagement !== ""
            ? Number(
                filterMaxEngagement
              )
            : null;


        const matchesMaxEngagement =
          maxEngagement ===
            null ||
          member.engagement_score <=
            maxEngagement;


        return (
          matchesLang &&
          matchesGeo &&
          matchesOccupation &&
          matchesMinEngagement &&
          matchesMaxEngagement
        );
      }
    );


  /* ==========================================================
     RESET FILTERS
     ========================================================== */

  function clearFilters() {

    setFilterLang("");
    setFilterGeo("");
    setFilterOccupation("");
    setFilterMinEngagement("");
    setFilterMaxEngagement("");
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">

      <div className="mx-auto max-w-[1600px] space-y-8">


        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="flex flex-col justify-between gap-6 rounded-3xl border-l-8 border-indigo-600 bg-white p-8 shadow-xl md:flex-row md:items-center">

          <div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">
              Audience Manager
            </h1>


            <p className="mt-2 max-w-2xl text-base text-slate-600">

              Welcome back{" "}

              <span className="font-semibold text-indigo-600">
                {currentUser}
              </span>

              ! Manage your audience,
              contact information and
              segmentation for targeted,
              multilingual mass communication
              campaigns.

            </p>

          </div>


          <div>

            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-inner">

              Total Members:{" "}

              {members.length}

            </span>

          </div>

        </div>


        {/* ====================================================
            GLOBAL MESSAGES
            ==================================================== */}

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


          {/* ==================================================
              ADD MEMBER
              ================================================== */}

          <div className="flex flex-col space-y-6 rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl lg:col-span-1">

            <div className="border-b border-indigo-50 pb-4">

              <h2 className="text-2xl font-bold text-slate-950">
                Add Member
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a person to your audience.
              </p>

            </div>


            <form
              onSubmit={
                handleAddMember
              }
              className="space-y-5"
            >


              {/* Name */}

              <div>

                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                  Full Name

                </label>


                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />

              </div>


              {/* Email */}

              <div>

                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                  Email Address

                </label>


                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>


              {/* Phone */}

              <div>

                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                  Phone Number

                </label>


                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <p className="mt-1.5 text-[11px] text-slate-400">

                  Provide at least an
                  email or phone number.

                </p>

              </div>


              {/* Language */}

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

                  Example: en, hi, te,
                  ta, bn

                </p>

              </div>


              {/* Geography */}

              <div>

                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                  Geography

                </label>


                <input
                  type="text"
                  placeholder="e.g. Andhra Pradesh"
                  value={geography}
                  onChange={(e) =>
                    setGeography(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>


              {/* Occupation */}

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


              {/* Submit */}

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


          {/* ==================================================
              AUDIENCE / SEGMENTATION
              ================================================== */}

          <div className="space-y-6 rounded-3xl border border-blue-100 bg-white p-8 shadow-xl lg:col-span-3">


            {/* Header */}

            <div className="border-b border-blue-50 pb-6">

              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

                <div>

                  <h2 className="text-2xl font-bold text-slate-950">
                    Audience Segmentation
                  </h2>


                  <p className="mt-1 text-sm text-slate-500">

                    Filter audience members
                    by language, geography,
                    occupation and engagement.

                  </p>

                </div>


                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">

                  Showing{" "}

                  {filteredMembers.length}

                  {" "}of{" "}

                  {members.length}

                </div>

              </div>


              {/* Filters */}

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">


                {/* Language */}

                <input
                  type="text"
                  placeholder="Language..."
                  value={filterLang}
                  onChange={(e) =>
                    setFilterLang(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />


                {/* Geography */}

                <input
                  type="text"
                  placeholder="Geography..."
                  value={filterGeo}
                  onChange={(e) =>
                    setFilterGeo(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />


                {/* Occupation */}

                <input
                  type="text"
                  placeholder="Occupation..."
                  value={
                    filterOccupation
                  }
                  onChange={(e) =>
                    setFilterOccupation(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />


                {/* Minimum engagement */}

                <input
                  type="number"
                  min="0"
                  placeholder="Min engagement..."
                  value={
                    filterMinEngagement
                  }
                  onChange={(e) =>
                    setFilterMinEngagement(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />


                {/* Maximum engagement */}

                <input
                  type="number"
                  min="0"
                  placeholder="Max engagement..."
                  value={
                    filterMaxEngagement
                  }
                  onChange={(e) =>
                    setFilterMaxEngagement(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>


              {/* Clear filters */}

              <div className="mt-4 flex justify-end">

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >

                  Clear Filters

                </button>

              </div>

            </div>


            {/* =================================================
                TABLE
                ================================================= */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px] border-collapse text-left">


                <thead>

                  <tr className="border-b-2 border-blue-100 text-xs font-bold uppercase tracking-widest text-blue-900">

                    <th className="px-5 py-4">
                      Name
                    </th>

                    <th className="px-5 py-4">
                      Email
                    </th>

                    <th className="px-5 py-4">
                      Phone
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

                    <th className="px-5 py-4">
                      Engagement
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-blue-50/50 text-sm">


                  {/* Loading */}

                  {loading ? (

                    <tr>

                      <td
                        colSpan={8}
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

                        <React.Fragment
                          key={
                            member.id
                          }
                        >


                          {/* =================================================
                              NORMAL ROW
                              ================================================= */}

                          {editingId !==
                            member.id ? (

                            <tr
                              className="transition hover:bg-blue-50/50"
                            >


                              {/* Name */}

                              <td className="px-5 py-4 font-semibold text-slate-950">

                                {
                                  member.name
                                }

                              </td>


                              {/* Email */}

                              <td className="px-5 py-4 text-slate-700">

                                {member.email ? (

                                  <span>
                                    {
                                      member.email
                                    }
                                  </span>

                                ) : (

                                  <span className="text-slate-400">
                                    Not provided
                                  </span>

                                )}

                              </td>


                              {/* Phone */}

                              <td className="px-5 py-4 text-slate-700">

                                {member.phone ? (

                                  <span>
                                    {
                                      member.phone
                                    }
                                  </span>

                                ) : (

                                  <span className="text-slate-400">
                                    Not provided
                                  </span>

                                )}

                              </td>


                              {/* Language */}

                              <td className="px-5 py-4">

                                <span className="rounded-lg border border-blue-200 bg-blue-100 px-3.5 py-1.5 text-xs font-bold uppercase text-blue-800 shadow-sm">

                                  {
                                    member.language
                                  }

                                </span>

                              </td>


                              {/* Geography */}

                              <td className="px-5 py-4 text-slate-700">

                                {
                                  member.geography ||
                                  "General"
                                }

                              </td>


                              {/* Occupation */}

                              <td className="px-5 py-4 text-slate-700">

                                {
                                  member.occupation ||
                                  "General"
                                }

                              </td>


                              {/* Engagement */}

                              <td className="px-5 py-4">

                                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">

                                  {Number(
                                    member.engagement_score ??
                                      0
                                  ).toFixed(1)}

                                </span>

                              </td>


                              {/* Actions */}

                              <td className="px-5 py-4 text-right">

                                <div className="flex justify-end gap-2">


                                  {/* Edit */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEdit(
                                        member
                                      )
                                    }
                                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-600 hover:text-white"
                                  >

                                    Edit

                                  </button>


                                  {/* Delete */}

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

                                </div>

                              </td>

                            </tr>

                          ) : (


                            /* =================================================
                               EDIT ROW
                               ================================================= */

                            <tr className="bg-indigo-50/40">

                              <td
                                colSpan={8}
                                className="p-5"
                              >

                                <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">


                                  <div className="mb-5">

                                    <h3 className="text-lg font-bold text-slate-950">

                                      Edit Audience
                                      Member

                                    </h3>


                                    <p className="mt-1 text-sm text-slate-500">

                                      Update the
                                      member's contact
                                      information and
                                      segmentation data.

                                    </p>

                                  </div>


                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">


                                    {/* Name */}

                                    <div>

                                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                                        Full Name

                                      </label>


                                      <input
                                        type="text"
                                        value={
                                          editName
                                        }
                                        onChange={(e) =>
                                          setEditName(
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />

                                    </div>


                                    {/* Email */}

                                    <div>

                                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                                        Email Address

                                      </label>


                                      <input
                                        type="email"
                                        value={
                                          editEmail
                                        }
                                        onChange={(e) =>
                                          setEditEmail(
                                            e.target.value
                                          )
                                        }
                                        placeholder="john@example.com"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />

                                    </div>


                                    {/* Phone */}

                                    <div>

                                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                                        Phone Number

                                      </label>


                                      <input
                                        type="tel"
                                        value={
                                          editPhone
                                        }
                                        onChange={(e) =>
                                          setEditPhone(
                                            e.target.value
                                          )
                                        }
                                        placeholder="+91 9876543210"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />

                                    </div>


                                    {/* Language */}

                                    <div>

                                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                                        Language Code

                                      </label>


                                      <input
                                        type="text"
                                        value={
                                          editLanguage
                                        }
                                        onChange={(e) =>
                                          setEditLanguage(
                                            e.target.value
                                          )
                                        }
                                        placeholder="en, hi, te"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />

                                    </div>


                                    {/* Geography */}

                                    <div>

                                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                                        Geography

                                      </label>


                                      <input
                                        type="text"
                                        value={
                                          editGeography
                                        }
                                        onChange={(e) =>
                                          setEditGeography(
                                            e.target.value
                                          )
                                        }
                                        placeholder="Andhra Pradesh"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />

                                    </div>


                                    {/* Occupation */}

                                    <div>

                                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-900">

                                        Occupation

                                      </label>


                                      <input
                                        type="text"
                                        value={
                                          editOccupation
                                        }
                                        onChange={(e) =>
                                          setEditOccupation(
                                            e.target.value
                                          )
                                        }
                                        placeholder="Farmer, Teacher"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />

                                    </div>

                                  </div>


                                  {/* Edit Actions */}

                                  <div className="mt-6 flex justify-end gap-3">


                                    <button
                                      type="button"
                                      onClick={
                                        cancelEdit
                                      }
                                      disabled={
                                        savingEdit
                                      }
                                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                                    >

                                      Cancel

                                    </button>


                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSaveEdit(
                                          member.id
                                        )
                                      }
                                      disabled={
                                        savingEdit
                                      }
                                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >

                                      {savingEdit
                                        ? "Saving..."
                                        : "Save Changes"}

                                    </button>

                                  </div>

                                </div>

                              </td>

                            </tr>

                          )}

                        </React.Fragment>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan={8}
                        className="py-12 text-center text-base font-medium text-blue-900"
                      >

                        No members found.
                        Try adjusting
                        your filters.

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