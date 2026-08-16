import type { CurrentUser } from "../api/auth";

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-[12.5px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{value}</span>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  campaign_manager: "Campaign Manager",
  comms_team: "Comms Team",
};

export default function Settings({
  user,
}: {
  user: CurrentUser | null;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
      <h1 className="text-[22px] font-bold text-slate-900">
        Settings
      </h1>

      <p className="mt-1 text-[13px] text-slate-500">
        Your account details.
      </p>

      <div className="mt-5 max-w-lg rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        {!user && (
          <p className="text-[13px] text-slate-500">
            Loading profile…
          </p>
        )}

        {user && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE9FE] text-[16px] font-semibold uppercase text-[#5A3FD6]">
                {(user.name ?? "U").charAt(0)}
              </div>

              <div>
                <p className="text-[15px] font-semibold text-slate-900">
                  {user.name ?? "User"}
                </p>

                <p className="text-[12px] text-slate-500">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Row label="Email" value={user.email} />
              <Row label="Phone" value={user.phone} />
              <Row
                label="Role"
                value={ROLE_LABELS[user.role] ?? user.role}
              />
              <Row
                label="Status"
                value={user.is_active ? "Active" : "Inactive"}
              />
              <Row label="Admin ID" value={user.admin_id} />
              <Row label="Department" value={user.department} />
              <Row label="Access Level" value={user.access_level} />
              <Row label="Manager ID" value={user.manager_id} />
              <Row
                label="Assigned Region"
                value={user.assigned_region}
              />
              <Row
                label="Shift Timing"
                value={user.shift_timing}
              />
            </div>

            <p className="mt-4 text-[11.5px] text-slate-400">
              Profile editing isn&apos;t available yet — this view is
              read-only.
            </p>
          </>
        )}
      </div>
    </div>
  );
}