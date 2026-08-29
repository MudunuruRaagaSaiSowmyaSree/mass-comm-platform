import { useState } from "react";
import { registerUser } from "../api/auth";

type Role = "admin" | "campaign_manager" | "comms_team";

/* ------------------------------------------------------------------ */
/* Small inline icon set                                               */
/* ------------------------------------------------------------------ */

function Icon({
  path,
  className = "w-5 h-5",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const paths = {
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3m-3 0h6",

  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",

  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 0 8 7 8-7",

  phone: "M4 5c0-1 1-2 2-2h2l2 5-2 1.5A11 11 0 0 0 13.5 15l1.5-2 5 2v2c0 1-1 2-2 2C10 19 4 13 4 5Z",

  lock: "M6 11V8a6 6 0 1 1 12 0v3M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm7 5v2",

  chevronDown: "M6 9l6 6 6-6",

  arrowRight: "M5 12h14M13 6l6 6-6 6",

  idCard:
    "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3 4h.01M7 14h4m4-4h6m-6 4h6",
};

/* ------------------------------------------------------------------ */
/* Reusable Field                                                      */
/* ------------------------------------------------------------------ */

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12.5px] font-medium text-slate-600">
        {label}
      </label>

      <div className="relative">
        <Icon
          path={icon}
          className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
        />

        {children}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-11 pr-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20";

/* ------------------------------------------------------------------ */
/* Register Page                                                       */
/* ------------------------------------------------------------------ */

function Register({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  /*
   * Backend values remain:
   *
   * admin
   * comms_team
   * campaign_manager
   *
   * Only the displayed names are changed for the user.
   */
  const [role, setRole] = useState<Role>("comms_team");

  /* Admin fields */
  const [adminId, setAdminId] = useState("");
  const [department, setDepartment] = useState("");
  const [accessLevel, setAccessLevel] = useState("");

  /* Campaign Manager fields */
  const [managerId, setManagerId] = useState("");
  const [assignedRegion, setAssignedRegion] = useState("");
  const [shiftTiming, setShiftTiming] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ---------------------------------------------------------------- */
  /* Submit                                                            */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      await registerUser({
        name,
        email,
        phone,
        password,
        role,

        ...(role === "admin" && {
          admin_id: adminId,
          department,
          access_level: accessLevel,
        }),

        ...(role === "campaign_manager" && {
          manager_id: managerId,
          assigned_region: assignedRegion,
          shift_timing: shiftTiming,
        }),
      });

      onSuccess();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(
          detail
            .map((d: any) => d.msg)
            .join("; ")
        );
      } else {
        setError("Registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /* UI                                                                */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#8B7CF6] to-[#4C3AC9] p-4 lg:p-8">

      <div className="w-full max-w-[460px] overflow-hidden rounded-[28px] bg-white p-8 shadow-2xl lg:p-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C6CF0] to-[#5A3FD6] shadow-md">
            <Icon
              path={paths.mic}
              className="h-4.5 w-4.5 text-white"
            />
          </div>

          <div>
            <p className="text-[15px] font-bold leading-none text-slate-900">
              VoiceAssist
            </p>

            <p className="mt-0.5 text-[11px] leading-none text-slate-500">
              AI Assistant for Rural Users
            </p>
          </div>

        </div>

        {/* Heading */}
        <div className="mt-6 text-center">

          <h2 className="text-[22px] font-extrabold text-slate-900">
            Create your account
          </h2>

          <p className="mt-1 text-[13px] text-slate-500">
            Join VoiceAssist to get started
          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3.5"
        >

          {/* Full Name */}
          <Field
            label="Full Name"
            icon={paths.user}
          >
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              placeholder="e.g. Sowmya Reddy"
              className={inputClass}
            />
          </Field>

          {/* Email */}
          <Field
            label="Email"
            icon={paths.mail}
          >
            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>

          {/* Phone */}
          <Field
            label="Phone"
            icon={paths.phone}
          >
            <input
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              required
              placeholder="10-digit number"
              className={inputClass}
            />
          </Field>

          {/* Password */}
          <Field
            label="Password"
            icon={paths.lock}
          >
            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              minLength={6}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </Field>

          {/* Role */}
          <div>

            <label className="mb-1 block text-[12.5px] font-medium text-slate-600">
              Role
            </label>

            <div className="relative">

              <select
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value as Role
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-3.5 pr-9 text-[13.5px] text-slate-800 outline-none transition focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
              >

                {/* USER */}
                <option value="comms_team">
                  User
                </option>

                {/* CAMPAIGN MANAGER */}
                <option value="campaign_manager">
                  Campaign Manager
                </option>

                {/* ADMIN */}
                <option value="admin">
                  Admin
                </option>

              </select>

              <Icon
                path={paths.chevronDown}
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />

            </div>

          </div>

          {/* -------------------------------------------------------- */}
          {/* ADMIN DETAILS                                             */}
          {/* -------------------------------------------------------- */}

          {role === "admin" && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">

              <p className="text-[12px] font-semibold text-slate-600">
                Admin details
              </p>

              <Field
                label="Admin ID"
                icon={paths.idCard}
              >
                <input
                  value={adminId}
                  onChange={(e) =>
                    setAdminId(e.target.value)
                  }
                  required
                  placeholder="Admin ID"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Department"
                icon={paths.idCard}
              >
                <input
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value)
                  }
                  required
                  placeholder="Department"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Access Level"
                icon={paths.idCard}
              >
                <input
                  value={accessLevel}
                  onChange={(e) =>
                    setAccessLevel(e.target.value)
                  }
                  required
                  placeholder="e.g. Full Access"
                  className={inputClass}
                />
              </Field>

            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* CAMPAIGN MANAGER DETAILS                                  */}
          {/* -------------------------------------------------------- */}

          {role === "campaign_manager" && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">

              <p className="text-[12px] font-semibold text-slate-600">
                Campaign Manager details
              </p>

              <Field
                label="Manager ID"
                icon={paths.idCard}
              >
                <input
                  value={managerId}
                  onChange={(e) =>
                    setManagerId(e.target.value)
                  }
                  required
                  placeholder="Manager ID"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Assigned Region"
                icon={paths.idCard}
              >
                <input
                  value={assignedRegion}
                  onChange={(e) =>
                    setAssignedRegion(e.target.value)
                  }
                  required
                  placeholder="e.g. Telangana"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Shift Timing"
                icon={paths.idCard}
              >
                <input
                  value={shiftTiming}
                  onChange={(e) =>
                    setShiftTiming(e.target.value)
                  }
                  required
                  placeholder="e.g. 9 AM - 5 PM"
                  className={inputClass}
                />
              </Field>

            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[12.5px] text-rose-500">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-3 text-[13.5px] font-semibold text-white shadow-md shadow-[#6C5CE7]/30 transition hover:brightness-105 disabled:opacity-60"
          >

            {submitting
              ? "Creating account..."
              : "Create Account"}

            {!submitting && (
              <Icon
                path={paths.arrowRight}
                className="h-4 w-4"
              />
            )}

          </button>

        </form>

        {/* Login */}
        <p className="mt-5 text-center text-[12.5px] text-slate-500">

          Already have an account?{" "}

          <button
            type="button"
            onClick={onBack}
            className="font-semibold text-[#6C5CE7] hover:underline"
          >
            Log in
          </button>

        </p>

      </div>

    </div>
  );
}

export default Register;