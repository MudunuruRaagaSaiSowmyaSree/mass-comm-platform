import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  fetchCurrentUser,
  updateCurrentUser,
  type CurrentUser,
} from "../api/auth";


/* ============================================================
   TYPES
   ============================================================ */

interface SettingsProps {
  user: CurrentUser;
}

type UserRole =
  | "admin"
  | "campaign_manager"
  | "comms_team";


/* ============================================================
   ROLE LABELS
   ============================================================ */

const ROLE_LABELS: Record<
  UserRole,
  string
> = {
  admin: "Admin",
  campaign_manager: "Manager",
  comms_team: "Campaign Person",
};


/* ============================================================
   SETTINGS PAGE
   ============================================================ */

export default function Settings({
  user,
}: SettingsProps) {

  /* ==========================================================
     PROFILE
     ========================================================== */

  const [name, setName] =
    useState<string>(
      user.name ?? ""
    );

  const [phone, setPhone] =
    useState<string>(
      user.phone ?? ""
    );


  /* ==========================================================
     ADMIN
     ========================================================== */

  const [department, setDepartment] =
    useState<string>(
      user.department ?? ""
    );

  const [accessLevel, setAccessLevel] =
    useState<string>(
      user.access_level ?? ""
    );


  /* ==========================================================
     MANAGER
     ========================================================== */

  const [assignedRegion, setAssignedRegion] =
    useState<string>(
      user.assigned_region ?? ""
    );

  const [shiftTiming, setShiftTiming] =
    useState<string>(
      user.shift_timing ?? ""
    );


  /* ==========================================================
     UI STATE
     ========================================================== */

  const [loading, setLoading] =
    useState<boolean>(false);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [message, setMessage] =
    useState<string | null>(
      null
    );

  const [error, setError] =
    useState<string | null>(
      null
    );


  /* ==========================================================
     LOAD CURRENT USER
     ========================================================== */

  useEffect(() => {

    let cancelled = false;

    async function loadProfile() {

      setLoading(true);
      setError(null);

      try {

        const currentUser =
          await fetchCurrentUser();

        if (cancelled) {
          return;
        }

        setName(
          currentUser.name ?? ""
        );

        setPhone(
          currentUser.phone ?? ""
        );

        setDepartment(
          currentUser.department ?? ""
        );

        setAccessLevel(
          currentUser.access_level ?? ""
        );

        setAssignedRegion(
          currentUser.assigned_region ?? ""
        );

        setShiftTiming(
          currentUser.shift_timing ?? ""
        );

      } catch (err) {

        console.error(
          "Failed to load profile:",
          err
        );

        if (!cancelled) {

          setError(
            "Could not load your profile."
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };

  }, []);


  /* ==========================================================
     SAVE PROFILE
     ========================================================== */

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setSaving(true);
    setMessage(null);
    setError(null);

    try {

      const response =
        await updateCurrentUser({

          name:
            name.trim(),

          phone:
            phone.trim(),

          ...(user.role === "admin"
            ? {
                department:
                  department.trim(),

                access_level:
                  accessLevel.trim(),
              }
            : {}),

          ...(user.role ===
          "campaign_manager"
            ? {
                assigned_region:
                  assignedRegion.trim(),

                shift_timing:
                  shiftTiming.trim(),
              }
            : {}),
        });


      /*
       * Backend currently returns:
       *
       * {
       *   message: "...",
       *   user: {...}
       * }
       */

      const updatedUser:
        CurrentUser =
        response.user ?? response;


      setName(
        updatedUser.name ?? ""
      );

      setPhone(
        updatedUser.phone ?? ""
      );

      setDepartment(
        updatedUser.department ?? ""
      );

      setAccessLevel(
        updatedUser.access_level ?? ""
      );

      setAssignedRegion(
        updatedUser.assigned_region ??
          ""
      );

      setShiftTiming(
        updatedUser.shift_timing ??
          ""
      );

      setMessage(
        response.message ??
          "Profile updated successfully."
      );

    } catch (err: any) {

      console.error(
        "Failed to update profile:",
        err
      );

      setError(
        err?.response?.data?.detail ??
          "Could not update your profile."
      );

    } finally {

      setSaving(false);

    }
  }


  /* ==========================================================
     ROLE
     ========================================================== */

  const role =
    user.role as UserRole;

  const roleLabel =
    ROLE_LABELS[role] ??
    role;


  /* ==========================================================
     INITIALS
     ========================================================== */

  const displayName =
    user.name?.trim() ||
    user.email;

  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .toUpperCase();


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">

      <div className="mx-auto w-full max-w-5xl px-8 py-6">

        {/* ====================================================
           HEADER
           ==================================================== */}

        <div>

          <h1 className="text-[22px] font-bold text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-[13px] text-slate-500">
            Manage your profile and account information.
          </p>

        </div>


        {/* ====================================================
           SUCCESS
           ==================================================== */}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">

            <p className="text-[12px] font-medium text-emerald-700">
              {message}
            </p>

          </div>
        )}


        {/* ====================================================
           ERROR
           ==================================================== */}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">

            <p className="text-[12px] font-medium text-rose-600">
              {error}
            </p>

          </div>
        )}


        {/* ====================================================
           PROFILE SUMMARY
           ==================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[17px] font-bold text-violet-700">
              {initials}
            </div>


            <div className="min-w-0">

              <p className="truncate text-[16px] font-bold text-slate-900">
                {user.name ||
                  "Unnamed User"}
              </p>

              <p className="mt-1 truncate text-[12px] text-slate-500">
                {user.email}
              </p>

              <div className="mt-2">

                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                  {roleLabel}
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* ====================================================
           PROFILE FORM
           ==================================================== */}

        <form
          onSubmit={handleSave}
          className="mt-5"
        >

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            {/* ------------------------------------------------
               SECTION TITLE
               ------------------------------------------------ */}

            <div className="border-b border-slate-100 pb-4">

              <p className="text-[14px] font-semibold text-slate-900">
                Profile Information
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Update your account information.
              </p>

            </div>


            {/* ------------------------------------------------
               LOADING
               ------------------------------------------------ */}

            {loading ? (

              <div className="py-12 text-center">

                <p className="text-[12px] text-slate-400">
                  Loading profile...
                </p>

              </div>

            ) : (

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* ==================================================
                   NAME
                   ================================================== */}

                <div>

                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />

                </div>


                {/* ==================================================
                   EMAIL
                   ================================================== */}

                <div>

                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-500 outline-none"
                  />

                  <p className="mt-1 text-[9.5px] text-slate-400">
                    Email cannot be changed here.
                  </p>

                </div>


                {/* ==================================================
                   PHONE
                   ================================================== */}

                <div>

                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    placeholder="Phone number"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />

                </div>


                {/* ==================================================
                   ROLE
                   ================================================== */}

                <div>

                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                    Role
                  </label>

                  <input
                    type="text"
                    value={roleLabel}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-500 outline-none"
                  />

                  <p className="mt-1 text-[9.5px] text-slate-400">
                    Role is managed by the system administrator.
                  </p>

                </div>


                {/* ==================================================
                   ADMIN FIELDS
                   ================================================== */}

                {role === "admin" && (
                  <>

                    <div>

                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                        Department
                      </label>

                      <input
                        type="text"
                        value={
                          department
                        }
                        onChange={(
                          event
                        ) =>
                          setDepartment(
                            event.target.value
                          )
                        }
                        placeholder="Department"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                        Access Level
                      </label>

                      <input
                        type="text"
                        value={
                          accessLevel
                        }
                        onChange={(
                          event
                        ) =>
                          setAccessLevel(
                            event.target.value
                          )
                        }
                        placeholder="Access level"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />

                    </div>

                  </>
                )}


                {/* ==================================================
                   MANAGER FIELDS
                   ================================================== */}

                {role ===
                  "campaign_manager" && (
                  <>

                    <div>

                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                        Manager ID
                      </label>

                      <input
                        type="text"
                        value={
                          user.manager_id ??
                          "Not assigned"
                        }
                        disabled
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-500 outline-none"
                      />

                      <p className="mt-1 text-[9.5px] text-slate-400">
                        Manager ID is assigned by the administrator.
                      </p>

                    </div>


                    <div>

                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                        Assigned Region
                      </label>

                      <input
                        type="text"
                        value={
                          assignedRegion
                        }
                        onChange={(
                          event
                        ) =>
                          setAssignedRegion(
                            event.target.value
                          )
                        }
                        placeholder="Assigned region"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                        Shift Timing
                      </label>

                      <input
                        type="text"
                        value={
                          shiftTiming
                        }
                        onChange={(
                          event
                        ) =>
                          setShiftTiming(
                            event.target.value
                          )
                        }
                        placeholder="09:00 AM - 06:00 PM"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />

                    </div>

                  </>
                )}


                {/* ==================================================
                   CAMPAIGN PERSON
                   ================================================== */}

                {role ===
                  "comms_team" && (
                  <div>

                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                      Manager ID
                    </label>

                    <input
                      type="text"
                      value={
                        user.manager_id ??
                        "Not assigned"
                      }
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-500 outline-none"
                    />

                    <p className="mt-1 text-[9.5px] text-slate-400">
                      Manager assignment is controlled by the administrator.
                    </p>

                  </div>
                )}

              </div>
            )}


            {/* ====================================================
               SAVE BUTTON
               ==================================================== */}

            {!loading && (

              <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#6654E9] px-5 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#5746D8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            )}

          </div>

        </form>


        {/* ====================================================
           ACCOUNT INFORMATION
           ==================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="border-b border-slate-100 pb-4">

            <p className="text-[14px] font-semibold text-slate-900">
              Account Information
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              Basic information about your account.
            </p>

          </div>


          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">

            <div className="rounded-xl bg-slate-50 p-3.5">

              <p className="text-[10px] text-slate-500">
                Account ID
              </p>

              <p className="mt-1 break-all text-[11px] font-medium text-slate-700">
                {user.id}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-3.5">

              <p className="text-[10px] text-slate-500">
                Registration Date
              </p>

              <p className="mt-1 text-[11px] font-medium text-slate-700">
                {user.registration_date
                  ? new Date(
                      user.registration_date
                    ).toLocaleDateString()
                  : "—"}
              </p>

            </div>


            {role ===
              "campaign_manager" && (
              <div className="rounded-xl bg-slate-50 p-3.5">

                <p className="text-[10px] text-slate-500">
                  Assigned Region
                </p>

                <p className="mt-1 text-[11px] font-medium text-slate-700">
                  {user.assigned_region ??
                    "—"}
                </p>

              </div>
            )}


            {role ===
              "campaign_manager" && (
              <div className="rounded-xl bg-slate-50 p-3.5">

                <p className="text-[10px] text-slate-500">
                  Shift Timing
                </p>

                <p className="mt-1 text-[11px] font-medium text-slate-700">
                  {user.shift_timing ??
                    "—"}
                </p>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}