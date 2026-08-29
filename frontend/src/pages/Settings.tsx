import { useEffect, useState } from "react";
import type { CurrentUser } from "../api/auth";
import {
  updateCurrentUser,
  changePassword,
} from "../api/auth";

import {
  fetchChannelConfigs,
  enableChannel,
  disableChannel,
  type ChannelConfig,
} from "../api/channelConfig";

// ============================================================
// TYPES
// ============================================================

type ChannelName =
  | "email"
  | "sms"
  | "whatsapp"
  | "push"
  | "web_broadcast";

// ============================================================
// PROFILE ROW
// ============================================================

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
      <span className="text-[12.5px] text-slate-500">
        {label}
      </span>

      <span className="text-[13px] font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}

// ============================================================
// ROLE LABELS
// ============================================================

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  campaign_manager: "Campaign Manager",
  comms_team: "Comms Team",
};

// ============================================================
// CHANNELS
// ============================================================

const CHANNELS: {
  key: ChannelName;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "email",
    label: "Email",
    description: "Send campaign messages through email.",
    icon: "📧",
  },
  {
    key: "sms",
    label: "SMS",
    description: "Send campaign messages through SMS.",
    icon: "💬",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "Send campaign messages through WhatsApp.",
    icon: "🟢",
  },
  {
    key: "push",
    label: "Push Notifications",
    description: "Send notifications to connected devices.",
    icon: "🔔",
  },
  {
    key: "web_broadcast",
    label: "Web Broadcast",
    description: "Broadcast messages through the web platform.",
    icon: "🌐",
  },
];

// ============================================================
// SETTINGS PAGE
// ============================================================

export default function Settings({
  user,
  onUserUpdated,
}: {
  user: CurrentUser | null;
  onUserUpdated?: (user: CurrentUser) => void;
}) {
  // ============================================================
  // PROFILE EDITING
  // ============================================================

  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [accessLevel, setAccessLevel] = useState("");
  const [assignedRegion, setAssignedRegion] = useState("");
  const [shiftTiming, setShiftTiming] = useState("");

  const [saving, setSaving] = useState(false);

  // ============================================================
  // PROFILE MESSAGES
  // ============================================================

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // CHANNEL CONFIGURATION
  // ============================================================

  const [channelConfigs, setChannelConfigs] = useState<
    ChannelConfig[]
  >([]);

  const [loadingChannels, setLoadingChannels] =
    useState(true);

  const [channelError, setChannelError] =
    useState("");

  const [channelSuccess, setChannelSuccess] =
    useState("");

  const [savingChannel, setSavingChannel] =
    useState<ChannelName | null>(null);

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  // ============================================================
  // LOAD USER DATA
  // ============================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setDepartment(user.department ?? "");
    setAccessLevel(user.access_level ?? "");
    setAssignedRegion(user.assigned_region ?? "");
    setShiftTiming(user.shift_timing ?? "");
  }, [user]);

  // ============================================================
  // LOAD CHANNEL CONFIGURATION
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadChannelConfigs() {
      setLoadingChannels(true);
      setChannelError("");

      try {
        const configs = await fetchChannelConfigs();

        if (!cancelled) {
          setChannelConfigs(configs);
        }
      } catch (err: any) {
        console.error(
          "Channel configuration load error:",
          err
        );

        if (!cancelled) {
          setChannelError(
            err?.response?.data?.detail ??
              "Unable to load channel configuration."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingChannels(false);
        }
      }
    }

    loadChannelConfigs();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // PROFILE EDIT
  // ============================================================

  function handleEdit() {
    if (!user) {
      return;
    }

    setError("");
    setSuccess("");
    setEditing(true);
  }

  function handleCancel() {
    if (!user) {
      return;
    }

    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setDepartment(user.department ?? "");
    setAccessLevel(user.access_level ?? "");
    setAssignedRegion(user.assigned_region ?? "");
    setShiftTiming(user.shift_timing ?? "");

    setError("");
    setSuccess("");
    setEditing(false);
  }

  async function handleSave() {
    if (!user) {
      setError("User profile is not available.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await updateCurrentUser({
        name: name.trim(),
        phone: phone.trim(),
        department: department.trim(),
        access_level: accessLevel.trim(),
        assigned_region: assignedRegion.trim(),
        shift_timing: shiftTiming.trim(),
      });

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }

      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch (err: any) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err?.response?.data?.detail ??
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  async function handleChangePassword(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirmation do not match."
      );
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess(
        "Password changed successfully."
      );
    } catch (err: any) {
      console.error(
        "Change password error:",
        err
      );

      setPasswordError(
        err?.response?.data?.detail ??
          "Unable to change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  // ============================================================
  // CHANNEL HELPERS
  // ============================================================

  function getChannelConfig(
    channel: ChannelName
  ): ChannelConfig {
    const existing = channelConfigs.find(
      (item) => item.channel === channel
    );

    if (existing) {
      return existing;
    }

    return {
      channel,
      enabled: false,
      config: {},
    };
  }

  function getChannelLabel(
    channel: ChannelName
  ): string {
    return (
      CHANNELS.find(
        (item) => item.key === channel
      )?.label ?? channel
    );
  }

  // ============================================================
  // ENABLE / DISABLE CHANNEL
  // ============================================================

  async function handleChannelToggle(
    channel: ChannelName,
    enabled: boolean
  ) {
    setSavingChannel(channel);
    setChannelError("");
    setChannelSuccess("");

    try {
      const updated = enabled
        ? await enableChannel(channel)
        : await disableChannel(channel);

      setChannelConfigs((current) => {
        const exists = current.some(
          (item) => item.channel === channel
        );

        if (exists) {
          return current.map((item) =>
            item.channel === channel
              ? updated
              : item
          );
        }

        return [...current, updated];
      });

      setChannelSuccess(
        `${getChannelLabel(channel)} ${
          enabled ? "enabled" : "disabled"
        } successfully.`
      );
    } catch (err: any) {
      console.error(
        "Channel configuration update error:",
        err
      );

      setChannelError(
        err?.response?.data?.detail ??
          `Unable to ${
            enabled ? "enable" : "disable"
          } ${getChannelLabel(channel)}.`
      );
    } finally {
      setSavingChannel(null);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex max-w-3xl items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-[13px] text-slate-500">
            Manage your account and communication settings.
          </p>
        </div>

        {user && !editing && (
          <button
            onClick={handleEdit}
            className="rounded-xl bg-[#5A3FD6] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#4C32C2]"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* ======================================================
          PROFILE CARD
      ====================================================== */}

      <div className="mt-5 max-w-3xl rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        {!user && (
          <p className="text-[13px] text-slate-500">
            Loading profile...
          </p>
        )}

        {user && (
          <>
            {/* Profile header */}

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

            {/* ==================================================
                VIEW PROFILE
            ================================================== */}

            {!editing && (
              <div className="mt-4">

                <Row
                  label="Email"
                  value={user.email}
                />

                <Row
                  label="Phone"
                  value={user.phone}
                />

                <Row
                  label="Role"
                  value={
                    ROLE_LABELS[user.role] ??
                    user.role
                  }
                />

                <Row
                  label="Status"
                  value={
                    user.is_active
                      ? "Active"
                      : "Inactive"
                  }
                />

                <Row
                  label="Admin ID"
                  value={user.admin_id}
                />

                <Row
                  label="Department"
                  value={user.department}
                />

                <Row
                  label="Access Level"
                  value={user.access_level}
                />

                <Row
                  label="Manager ID"
                  value={user.manager_id}
                />

                <Row
                  label="Assigned Region"
                  value={user.assigned_region}
                />

                <Row
                  label="Shift Timing"
                  value={user.shift_timing}
                />

              </div>
            )}

            {/* ==================================================
                EDIT PROFILE
            ================================================== */}

            {editing && (
              <div className="mt-5 space-y-4">

                {/* Email */}

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-600">
                    Email
                  </label>

                  <input
                    value={user.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-[13px] text-slate-500 outline-none"
                  />
                </div>

                {/* Name */}

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-600">
                    Name
                  </label>

                  <input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
                  />
                </div>

                {/* Phone */}

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-600">
                    Phone
                  </label>

                  <input
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
                  />
                </div>

                {/* Department */}

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-600">
                    Department
                  </label>

                  <input
                    value={department}
                    onChange={(e) =>
                      setDepartment(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
                  />
                </div>

                {/* Access Level */}

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-600">
                    Access Level
                  </label>

                  <input
                    value={accessLevel}
                    onChange={(e) =>
                      setAccessLevel(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
                  />
                </div>

                {/* Assigned Region */}

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-600">
                    Assigned Region
                  </label>

                  <input
                    value={assignedRegion}
                    onChange={(e) =>
                      setAssignedRegion(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
                  />
                </div>

                {/* Shift Timing */}

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-600">
                    Shift Timing
                  </label>

                  <input
                    value={shiftTiming}
                    onChange={(e) =>
                      setShiftTiming(e.target.value)
                    }
                    placeholder="Example: 9 AM - 6 PM"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
                  />
                </div>

                {/* Buttons */}

                <div className="flex justify-end gap-3 pt-2">

                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-[#5A3FD6] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#4C32C2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </div>
            )}

            {/* Profile success */}

            {success && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[12.5px] text-emerald-700">
                  {success}
                </p>
              </div>
            )}

            {/* Profile error */}

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-[12.5px] text-rose-600">
                  {error}
                </p>
              </div>
            )}
          </>
        )}

      </div>

      {/* ======================================================
          CHANNEL CONFIGURATION
      ====================================================== */}

      {user && (
        <div className="mt-5 max-w-3xl rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="mb-5">
            <h2 className="text-[16px] font-semibold text-slate-900">
              Channel Configuration
            </h2>

            <p className="mt-1 text-[12px] text-slate-500">
              Enable or disable the communication channels
              available to your campaigns.
            </p>
          </div>

          {/* Loading */}

          {loadingChannels && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[12.5px] text-slate-500">
                Loading channel configuration...
              </p>
            </div>
          )}

          {/* Error */}

          {channelError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-[12.5px] text-rose-600">
                {channelError}
              </p>
            </div>
          )}

          {/* Success */}

          {channelSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[12.5px] text-emerald-700">
                {channelSuccess}
              </p>
            </div>
          )}

          {/* Channel list */}

          {!loadingChannels && (
            <div className="space-y-3">

              {CHANNELS.map((channel) => {
                const config = getChannelConfig(
                  channel.key
                );

                const isSaving =
                  savingChannel === channel.key;

                return (
                  <div
                    key={channel.key}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >

                    {/* Channel information */}

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[20px] shadow-sm">
                        {channel.icon}
                      </div>

                      <div>

                        <p className="text-[13px] font-semibold text-slate-900">
                          {channel.label}
                        </p>

                        <p className="mt-0.5 text-[11.5px] text-slate-500">
                          {channel.description}
                        </p>

                        <p
                          className={`mt-1 text-[10.5px] font-semibold ${
                            config.enabled
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {config.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </p>

                      </div>

                    </div>

                    {/* Toggle */}

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        handleChannelToggle(
                          channel.key,
                          !config.enabled
                        )
                      }
                      className={`relative h-7 w-12 rounded-full transition ${
                        config.enabled
                          ? "bg-[#5A3FD6]"
                          : "bg-slate-300"
                      } ${
                        isSaving
                          ? "cursor-wait opacity-60"
                          : "cursor-pointer"
                      }`}
                      aria-label={`${
                        config.enabled
                          ? "Disable"
                          : "Enable"
                      } ${channel.label}`}
                    >

                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          config.enabled
                            ? "left-6"
                            : "left-1"
                        }`}
                      />

                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </div>
      )}

      {/* ======================================================
          CHANGE PASSWORD CARD
      ====================================================== */}

      {user && (
        <div className="mt-5 max-w-3xl rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="mb-5">
            <h2 className="text-[16px] font-semibold text-slate-900">
              Change Password
            </h2>

            <p className="mt-1 text-[12px] text-slate-500">
              Change your account password.
            </p>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="space-y-4"
          >

            {/* Current Password */}

            <div>
              <label
                htmlFor="current-password"
                className="mb-1.5 block text-[12px] font-semibold text-slate-600"
              >
                Current Password
              </label>

              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                placeholder="Enter current password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
              />
            </div>

            {/* New Password */}

            <div>
              <label
                htmlFor="new-password"
                className="mb-1.5 block text-[12px] font-semibold text-slate-600"
              >
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
              />

              <p className="mt-1.5 text-[11px] text-slate-400">
                Minimum 8 characters.
              </p>
            </div>

            {/* Confirm Password */}

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-[12px] font-semibold text-slate-600"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-[#5A3FD6] focus:ring-2 focus:ring-[#5A3FD6]/20"
              />
            </div>

            {/* Password error */}

            {passwordError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-[12.5px] text-rose-600">
                  {passwordError}
                </p>
              </div>
            )}

            {/* Password success */}

            {passwordSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[12.5px] text-emerald-700">
                  {passwordSuccess}
                </p>
              </div>
            )}

            {/* Change Password Button */}

            <div className="flex justify-end pt-2">

              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-xl bg-[#5A3FD6] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#4C32C2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPassword
                  ? "Changing Password..."
                  : "Change Password"}
              </button>

            </div>

          </form>

        </div>
      )}

    </div>
  );
}
