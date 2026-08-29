import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiClient,
} from "../api/client";

import {
  registerUser,
  type RegisterPayload,
} from "../api/auth";

import {
  Icon,
  icons,
} from "../components/Icon";


/* ============================================================
   USER TYPE
   ============================================================ */

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;

  role:
    | "admin"
    | "campaign_manager"
    | "comms_team";

  is_active: boolean;

  admin_id: string | null;
  department: string | null;
  access_level: string | null;

  manager_id: string | null;
  assigned_region: string | null;
  shift_timing: string | null;

  registration_date: string | null;
}


interface UsersResponse {
  total: number;
  users: UserRecord[];
}


/* ============================================================
   ROLE LABEL
   ============================================================ */

function roleLabel(
  role: UserRecord["role"]
) {
  switch (role) {
    case "admin":
      return "Admin";

    case "campaign_manager":
      return "Manager";

    case "comms_team":
      return "Campaign Person";

    default:
      return role;
  }
}


/* ============================================================
   ROLE BADGE
   ============================================================ */

function RoleBadge({
  role,
}: {
  role: UserRecord["role"];
}) {

  const classes =
    role === "admin"
      ? "bg-violet-50 text-violet-700"
      : role === "campaign_manager"
        ? "bg-blue-50 text-blue-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2.5
        py-1
        text-[10px]
        font-semibold
        ${classes}
      `}
    >
      {roleLabel(role)}
    </span>
  );
}


/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({
  active,
}: {
  active: boolean;
}) {

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2.5
        py-1
        text-[10px]
        font-semibold
        ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500"
        }
      `}
    >
      <span
        className={`
          mr-1.5
          h-1.5
          w-1.5
          rounded-full
          ${
            active
              ? "bg-emerald-500"
              : "bg-slate-400"
          }
        `}
      />

      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}


/* ============================================================
   STAT CARD
   ============================================================ */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  iconBg: string;
}) {

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-[11px] font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-[27px] font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {subtitle}
          </p>

        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{
            backgroundColor:
              iconBg,
          }}
        >

          <Icon
            path={icon}
            className="h-5 w-5"
          />

        </div>

      </div>
    </div>
  );
}


/* ============================================================
   USER MANAGEMENT
   ============================================================ */

export default function UserManagement() {

  /* ==========================================================
     DATA
     ========================================================== */

  const [
    users,
    setUsers,
  ] = useState<UserRecord[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  /* ==========================================================
     SEARCH
     ========================================================== */

  const [
    search,
    setSearch,
  ] = useState("");


  /* ==========================================================
     ROLE FILTER
     ========================================================== */

  const [
    roleFilter,
    setRoleFilter,
  ] = useState<
    "all"
    | "admin"
    | "campaign_manager"
    | "comms_team"
  >("all");


  /* ==========================================================
     STATUS FILTER
     ========================================================== */

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all"
    | "active"
    | "inactive"
  >("all");


  /* ==========================================================
     CREATE MODAL
     ========================================================== */

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);


  /* ==========================================================
     CREATE FORM
     ========================================================== */

  const [
    form,
    setForm,
  ] = useState<RegisterPayload>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "comms_team",

    admin_id: "",
    department: "",
    access_level: "",

    manager_id: "",
    assigned_region: "",
    shift_timing: "",
  });


  const [
    creating,
    setCreating,
  ] = useState(false);


  const [
    createError,
    setCreateError,
  ] = useState<string | null>(
    null
  );


  const [
    createSuccess,
    setCreateSuccess,
  ] = useState<string | null>(
    null
  );


  /* ==========================================================
     LOAD USERS
     ========================================================== */

  async function loadUsers() {

    setLoading(true);
    setError(null);

    try {

      const response =
        await apiClient.get<UsersResponse>(
          "/users"
        );

      setUsers(
        response.data.users ??
        []
      );

    } catch (err) {

      console.error(
        "Failed to load users:",
        err
      );

      setError(
        "Unable to load users. Please refresh and try again."
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {

    void loadUsers();

  }, []);


  /* ==========================================================
     SUMMARY
     ========================================================== */

  const totalUsers =
    users.length;


  const activeUsers =
    users.filter(
      (user) =>
        user.is_active
    ).length;


  const inactiveUsers =
    users.filter(
      (user) =>
        !user.is_active
    ).length;


  const adminCount =
    users.filter(
      (user) =>
        user.role === "admin"
    ).length;


  const managerCount =
    users.filter(
      (user) =>
        user.role ===
        "campaign_manager"
    ).length;


  const campaignPersonCount =
    users.filter(
      (user) =>
        user.role === "comms_team"
    ).length;


  /* ==========================================================
     FILTER USERS
     ========================================================== */

  const filteredUsers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return users.filter(
        (user) => {

          const matchesSearch =
            !query ||
            (
              user.name ??
              ""
            )
              .toLowerCase()
              .includes(query) ||
            user.email
              .toLowerCase()
              .includes(query) ||
            (
              user.phone ??
              ""
            )
              .toLowerCase()
              .includes(query);


          const matchesRole =
            roleFilter === "all" ||
            user.role === roleFilter;


          const matchesStatus =
            statusFilter === "all" ||
            (
              statusFilter ===
              "active"
                ? user.is_active
                : !user.is_active
            );


          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          );
        }
      );

    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ]);


  /* ==========================================================
     CREATE USER
     ========================================================== */

  async function handleCreateUser(
    event: React.FormEvent
  ) {

    event.preventDefault();

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);


    try {

      const payload: RegisterPayload = {
        name:
          form.name.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        password:
          form.password,

        role:
          form.role,
      };


      /*
       * Admin fields
       */

      if (
        form.role ===
        "admin"
      ) {

        payload.admin_id =
          form.admin_id?.trim();

        payload.department =
          form.department?.trim();

        payload.access_level =
          form.access_level?.trim();

      }


      /*
       * Manager fields
       */

      if (
        form.role ===
        "campaign_manager"
      ) {

        payload.manager_id =
          form.manager_id?.trim();

        payload.assigned_region =
          form.assigned_region?.trim();

        payload.shift_timing =
          form.shift_timing?.trim();

      }


      await registerUser(
        payload
      );


      setCreateSuccess(
        "User created successfully."
      );


      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "comms_team",

        admin_id: "",
        department: "",
        access_level: "",

        manager_id: "",
        assigned_region: "",
        shift_timing: "",
      });


      await loadUsers();


    } catch (err) {

      console.error(
        "User creation failed:",
        err
      );


      const message =
        (
          err as {
            response?: {
              data?: {
                detail?: string;
              };
            };
          }
        )
          ?.response
          ?.data
          ?.detail;


      setCreateError(
        message ??
        "Unable to create user."
      );


    } finally {

      setCreating(false);

    }
  }


  /* ==========================================================
     CLOSE CREATE MODAL
     ========================================================== */

  function closeCreateModal() {

    if (creating) {
      return;
    }

    setShowCreate(
      false
    );

    setCreateError(null);
    setCreateSuccess(null);

  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">

      <div className="px-8 py-6">

        {/* ====================================================
           HEADER
           ==================================================== */}

        <div className="flex items-start justify-between">

          <div>

            <h1 className="text-[22px] font-bold text-slate-900">
              User Management
            </h1>

            <p className="mt-1 text-[12px] text-slate-500">
              Manage platform users and role assignments.
            </p>

          </div>


          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                void loadUsers()
              }
              disabled={loading}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2.5
                text-[11px]
                font-semibold
                text-slate-600
                shadow-sm
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <Icon
                path={
                  icons.search
                }
                className="h-4 w-4"
              />

              Refresh

            </button>


            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreateSuccess(null);
                setShowCreate(true);
              }}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-[#6654E9]
                px-4
                py-2.5
                text-[11px]
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-[#5847D5]
              "
            >

              <span className="text-[16px] leading-none">
                +
              </span>

              Add User

            </button>

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
           STAT CARDS
           ==================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Total Users"
            value={
              totalUsers
            }
            subtitle="All platform users"
            icon={
              icons.users
            }
            iconBg="#6654E9"
          />


          <StatCard
            title="Active Users"
            value={
              activeUsers
            }
            subtitle="Currently active"
            icon={
              icons.users
            }
            iconBg="#10B981"
          />


          <StatCard
            title="Inactive Users"
            value={
              inactiveUsers
            }
            subtitle="Currently inactive"
            icon={
              icons.clock
            }
            iconBg="#94A3B8"
          />


          <StatCard
            title="Managers"
            value={
              managerCount
            }
            subtitle="Campaign Managers"
            icon={
              icons.users
            }
            iconBg="#338CF0"
          />


          <StatCard
            title="Campaign Persons"
            value={
              campaignPersonCount
            }
            subtitle="Communication team"
            icon={
              icons.users
            }
            iconBg="#10B981"
          />

        </div>


        {/* ====================================================
           FILTER BAR
           ==================================================== */}

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_160px]">

            {/* SEARCH */}

            <div className="relative">

              <Icon
                path={
                  icons.search
                }
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, email or phone..."
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-10
                  pr-4
                  text-[11px]
                  text-slate-700
                  outline-none
                  transition
                  focus:border-violet-300
                  focus:ring-2
                  focus:ring-violet-100
                "
              />

            </div>


            {/* ROLE */}

            <select
              value={
                roleFilter
              }
              onChange={(
                event
              ) =>
                setRoleFilter(
                  event.target.value as
                    | "all"
                    | "admin"
                    | "campaign_manager"
                    | "comms_team"
                )
              }
              className="
                h-11
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-[11px]
                text-slate-600
                outline-none
                focus:border-violet-300
              "
            >

              <option value="all">
                All Roles
              </option>

              <option value="admin">
                Admin
              </option>

              <option value="campaign_manager">
                Managers
              </option>

              <option value="comms_team">
                Campaign Persons
              </option>

            </select>


            {/* STATUS */}

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | "active"
                    | "inactive"
                )
              }
              className="
                h-11
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-[11px]
                text-slate-600
                outline-none
                focus:border-violet-300
              "
            >

              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

            </select>

          </div>

        </div>


        {/* ====================================================
           USER TABLE
           ==================================================== */}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          {/* TABLE HEADER */}

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>

              <p className="text-[13.5px] font-semibold text-slate-900">
                Platform Users
              </p>

              <p className="mt-1 text-[10.5px] text-slate-500">
                {filteredUsers.length} user
                {filteredUsers.length === 1
                  ? ""
                  : "s"} shown
              </p>

            </div>

          </div>


          {/* LOADING */}

          {loading ? (

            <div className="flex min-h-[260px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />

                <p className="mt-3 text-[11px] text-slate-400">
                  Loading users...
                </p>

              </div>

            </div>

          ) : filteredUsers.length === 0 ? (

            /* EMPTY */

            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">

                  <Icon
                    path={
                      icons.users
                    }
                    className="h-6 w-6 text-violet-500"
                  />

                </div>

                <p className="mt-4 text-[12px] font-semibold text-slate-700">
                  No users found
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Try changing your search or filters.
                </p>

              </div>

            </div>

          ) : (

            /* USER ROWS */

            <div className="divide-y divide-slate-100">

              {filteredUsers.map(
                (
                  user
                ) => (

                  <div
                    key={
                      user.id
                    }
                    className="px-5 py-4 transition hover:bg-slate-50"
                  >

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_auto] xl:items-center">

                      {/* USER */}

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[12px] font-bold text-violet-700">

                          {(user.name ??
                            user.email)
                            .charAt(
                              0
                            )
                            .toUpperCase()}

                        </div>


                        <div className="min-w-0">

                          <p className="truncate text-[11.5px] font-semibold text-slate-800">
                            {
                              user.name ??
                              "Unnamed User"
                            }
                          </p>

                          <p className="truncate text-[10px] text-slate-400">
                            ID:{" "}
                            {
                              user.id.slice(
                                0,
                                8
                              )
                            }
                          </p>

                        </div>

                      </div>


                      {/* CONTACT */}

                      <div className="min-w-0">

                        <p className="truncate text-[10.5px] text-slate-700">
                          {
                            user.email
                          }
                        </p>

                        <p className="mt-0.5 truncate text-[9.5px] text-slate-400">
                          {
                            user.phone ??
                            "No phone"
                          }
                        </p>

                      </div>


                      {/* ROLE */}

                      <div>

                        <RoleBadge
                          role={
                            user.role
                          }
                        />

                      </div>


                      {/* STATUS */}

                      <div>

                        <StatusBadge
                          active={
                            user.is_active
                          }
                        />

                      </div>


                      {/* DETAILS */}

                      <div className="min-w-0">

                        {user.role ===
                          "admin" && (

                          <p className="truncate text-[9.5px] text-slate-500">

                            {user.department ??
                              "Administration"}

                          </p>

                        )}


                        {user.role ===
                          "campaign_manager" && (

                          <p className="truncate text-[9.5px] text-slate-500">

                            Manager ID:{" "}
                            {user.manager_id ??
                              "—"}

                          </p>

                        )}


                        {user.role ===
                          "comms_team" && (

                          <p className="truncate text-[9.5px] text-slate-500">

                            Manager ID:{" "}
                            {user.manager_id ??
                              "Unassigned"}

                          </p>

                        )}

                      </div>


                      {/* DATE */}

                      <div className="text-right">

                        <p className="text-[9.5px] text-slate-400">

                          {user.registration_date
                            ? new Date(
                                user.registration_date
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month:
                                    "short",
                                  day:
                                    "numeric",
                                  year:
                                    "numeric",
                                }
                              )
                            : "—"}

                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>


        {/* ====================================================
           ROLE SUMMARY
           ==================================================== */}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

          <button
            type="button"
            onClick={() =>
              setRoleFilter(
                "admin"
              )
            }
            className="rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-violet-200 hover:shadow"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[11px] font-semibold text-slate-700">
                  Administrators
                </p>

                <p className="mt-1 text-[9.5px] text-slate-400">
                  Users with full platform access
                </p>

              </div>

              <span className="text-[20px] font-bold text-violet-600">
                {adminCount}
              </span>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              setRoleFilter(
                "campaign_manager"
              )
            }
            className="rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[11px] font-semibold text-slate-700">
                  Campaign Managers
                </p>

                <p className="mt-1 text-[9.5px] text-slate-400">
                  Manage campaigns and teams
                </p>

              </div>

              <span className="text-[20px] font-bold text-blue-600">
                {managerCount}
              </span>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              setRoleFilter(
                "comms_team"
              )
            }
            className="rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 hover:shadow"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[11px] font-semibold text-slate-700">
                  Campaign Persons
                </p>

                <p className="mt-1 text-[9.5px] text-slate-400">
                  Communication team members
                </p>

              </div>

              <span className="text-[20px] font-bold text-emerald-600">
                {campaignPersonCount}
              </span>

            </div>

          </button>

        </div>

      </div>


      {/* ======================================================
         CREATE USER MODAL
         ====================================================== */}

      {showCreate && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">

              <div>

                <p className="text-[15px] font-bold text-slate-900">
                  Add User
                </p>

                <p className="mt-1 text-[10px] text-slate-500">
                  Create a new platform account.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeCreateModal
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleCreateUser
              }
              className="space-y-5 p-6"
            >

              {/* BASIC */}

              <div>

                <p className="text-[11px] font-semibold text-slate-700">
                  Basic Information
                </p>


                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">

                  <input
                    required
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          name:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Full name"
                    className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                  />


                  <input
                    required
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          email:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Email address"
                    className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                  />


                  <input
                    required
                    value={
                      form.phone
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          phone:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Phone number"
                    className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                  />


                  <input
                    required
                    minLength={
                      8
                    }
                    type="password"
                    value={
                      form.password
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          password:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Password"
                    className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                  />

                </div>

              </div>


              {/* ROLE */}

              <div>

                <p className="text-[11px] font-semibold text-slate-700">
                  Role
                </p>


                <select
                  value={
                    form.role
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        role:
                          event
                            .target
                            .value as
                            RegisterPayload["role"],
                      })
                    )
                  }
                  className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] outline-none focus:border-violet-300"
                >

                  <option value="comms_team">
                    Campaign Person
                  </option>

                  <option value="campaign_manager">
                    Manager
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                </select>

              </div>


              {/* ADMIN FIELDS */}

              {form.role ===
                "admin" && (

                <div>

                  <p className="text-[11px] font-semibold text-slate-700">
                    Admin Information
                  </p>


                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">

                    <input
                      required
                      value={
                        form.admin_id ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            admin_id:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Admin ID"
                      className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                    />


                    <input
                      required
                      value={
                        form.department ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            department:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Department"
                      className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                    />


                    <input
                      required
                      value={
                        form.access_level ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            access_level:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Access level"
                      className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                    />

                  </div>

                </div>
              )}


              {/* MANAGER FIELDS */}

              {form.role ===
                "campaign_manager" && (

                <div>

                  <p className="text-[11px] font-semibold text-slate-700">
                    Manager Information
                  </p>


                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">

                    <input
                      required
                      value={
                        form.manager_id ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            manager_id:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Manager ID"
                      className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                    />


                    <input
                      required
                      value={
                        form.assigned_region ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            assigned_region:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Assigned region"
                      className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                    />


                    <input
                      required
                      value={
                        form.shift_timing ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            shift_timing:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Shift timing"
                      className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-300"
                    />

                  </div>

                </div>
              )}


              {/* CAMPAIGN PERSON */}

              {form.role ===
                "comms_team" && (

                <div className="rounded-xl bg-emerald-50 px-4 py-3">

                  <p className="text-[10px] font-semibold text-emerald-700">
                    Campaign Person
                  </p>

                  <p className="mt-1 text-[9.5px] text-emerald-600">
                    The user can be assigned to a Manager later from the team assignment workflow.
                  </p>

                </div>

              )}


              {/* FEEDBACK */}

              {createError && (

                <div className="rounded-xl bg-rose-50 px-4 py-3">

                  <p className="text-[10.5px] font-medium text-rose-600">
                    {
                      createError
                    }
                  </p>

                </div>

              )}


              {createSuccess && (

                <div className="rounded-xl bg-emerald-50 px-4 py-3">

                  <p className="text-[10.5px] font-medium text-emerald-600">
                    {
                      createSuccess
                    }
                  </p>

                </div>

              )}


              {/* ACTIONS */}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={
                    closeCreateModal
                  }
                  disabled={
                    creating
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10.5px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    creating
                  }
                  className="rounded-xl bg-[#6654E9] px-5 py-2.5 text-[10.5px] font-semibold text-white hover:bg-[#5847D5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}