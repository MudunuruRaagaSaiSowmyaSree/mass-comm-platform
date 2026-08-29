import { useState } from "react";
import { Icon, icons } from "./Icon";

export type UserRole =
  | "admin"
  | "campaign_manager"
  | "comms_team";

export type AppView =
  | "dashboard"
  | "campaigns"
  | "aiStudio"
  | "pipeline"
  | "templates"
  | "audience"
  | "voice"
  | "translations"
  | "compliance"
  | "review"
  | "chat"
  | "chatHistory"
  | "reports"
  | "settings";

type NavItem = {
  key: AppView;
  label: string;
  icon: string;
  roles: UserRole[];
};

/*
 * ============================================================
 * ROLE GROUPS
 * ============================================================
 */

const ALL_ROLES: UserRole[] = [
  "admin",
  "campaign_manager",
  "comms_team",
];

const CAMPAIGN_ROLES: UserRole[] = [
  "admin",
  "campaign_manager",
  "comms_team",
];

const MANAGEMENT_ROLES: UserRole[] = [
  "admin",
  "campaign_manager",
];

const ADMIN_ONLY: UserRole[] = [
  "admin",
];

const CAMPAIGN_WORKFLOW_ROLES: UserRole[] = [
  "admin",
  "campaign_manager",
];

/*
 * ============================================================
 * NAVIGATION ITEMS
 * ============================================================
 */

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: icons.grid,
    roles: ALL_ROLES,
  },

  {
    key: "campaigns",
    label: "Campaigns",
    icon: icons.megaphone,
    roles: CAMPAIGN_ROLES,
  },

  {
    key: "aiStudio",
    label: "AI Content Studio",
    icon: icons.sparkle,
    roles: ALL_ROLES,
  },

  {
    key: "pipeline",
    label: "Campaign Pipeline",
    icon: icons.sparkle,
    roles: CAMPAIGN_WORKFLOW_ROLES,
  },

  {
    key: "templates",
    label: "Templates",
    icon: icons.layout,
    roles: ALL_ROLES,
  },

  {
    key: "audience",
    label: "Audience",
    icon: icons.users,
    roles: MANAGEMENT_ROLES,
  },

  {
    key: "voice",
    label: "Voice Assistant",
    icon: icons.mic,
    roles: ALL_ROLES,
  },

  {
    key: "translations",
    label: "Translations",
    icon: icons.globe,
    roles: ALL_ROLES,
  },

  {
    key: "compliance",
    label: "Compliance",
    icon: icons.shield,
    roles: ADMIN_ONLY,
  },

  {
    key: "review",
    label: "Content Review",
    icon: icons.shield,
    roles: CAMPAIGN_WORKFLOW_ROLES,
  },

  {
    key: "chat",
    label: "AI Chat Assistant",
    icon: icons.sparkle,
    roles: ALL_ROLES,
  },

  {
    key: "chatHistory",
    label: "Chat History",
    icon: icons.clock,
    roles: ALL_ROLES,
  },

  {
    key: "reports",
    label: "Reports",
    icon: icons.chart,
    roles: ALL_ROLES,
  },

  {
    key: "settings",
    label: "Settings",
    icon: icons.settings,
    roles: ADMIN_ONLY,
  },
];

/*
 * ============================================================
 * ROLE LABELS
 * ============================================================
 */

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  campaign_manager: "Campaign Manager",
  comms_team: "User",
};

/*
 * ============================================================
 * SIDEBAR
 * ============================================================
 */

export default function Sidebar({
  active,
  onNavigate,
  userEmail,
  userRole,
  onLogout,
}: {
  active: AppView;
  onNavigate: (v: AppView) => void;
  userEmail: string;
  userRole: UserRole;
  onLogout: () => void;
}) {
  const [showLogoutConfirmation, setShowLogoutConfirmation] =
    useState(false);

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  function handleLogoutClick() {
    setShowLogoutConfirmation(true);
  }

  function handleCancelLogout() {
    setShowLogoutConfirmation(false);
  }

  function handleConfirmLogout() {
    setShowLogoutConfirmation(false);
    onLogout();
  }

  return (
    <>
      <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-gradient-to-b from-[#6C5CE7] to-[#5A3FD6] text-white">

        {/* ================================================== */}
        {/* LOGO                                               */}
        {/* ================================================== */}

        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Icon
              path={icons.speaker}
              className="h-4.5 w-4.5 text-white"
            />
          </div>

          <div>
            <p className="text-[15px] font-bold leading-none">
              CampaignHub
            </p>

            <p className="mt-1 text-[10.5px] leading-none text-white/60">
              Mass Communication
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* NAVIGATION                                         */}
        {/* ================================================== */}

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {visibleItems.map((item) => {
            const isActive = active === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium transition ${
                  isActive
                    ? "bg-white text-[#5A3FD6] shadow-sm"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon
                  path={item.icon}
                  className="h-4.5 w-4.5 flex-shrink-0"
                />

                {item.label}
              </button>
            );
          })}
        </nav>

        {/* ================================================== */}
        {/* USER INFORMATION + LOGOUT                          */}
        {/* ================================================== */}

        <div className="border-t border-white/15 px-4 py-4">

          <div className="flex items-center gap-2.5">

            {/* Avatar */}

            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-[12px] font-semibold uppercase">
              {userEmail.charAt(0) || "U"}
            </div>

            {/* User information */}

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold leading-none">
                {userEmail}
              </p>

              <p className="mt-1 text-[10.5px] leading-none text-white/55">
                {ROLE_LABELS[userRole]}
              </p>
            </div>

            <Icon
              path={icons.settings}
              className="h-4 w-4 flex-shrink-0 text-white/60"
            />
          </div>

          {/* ================================================= */}
          {/* LOGOUT BUTTON                                     */}
          {/* ================================================= */}

          <button
            type="button"
            onClick={handleLogoutClick}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[12.5px] font-medium text-white transition hover:bg-white/20"
          >
            <span>↪</span>
            Logout
          </button>

        </div>
      </aside>

      {/* ==================================================== */}
      {/* LOGOUT CONFIRMATION MODAL                            */}
      {/* ==================================================== */}

      {showLogoutConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={handleCancelLogout}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Icon */}

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE9FE] text-[#5A3FD6]">
              <span className="text-xl">↪</span>
            </div>

            {/* Title */}

            <h2 className="mt-4 text-center text-[18px] font-bold text-slate-900">
              Logout?
            </h2>

            {/* Message */}

            <p className="mt-2 text-center text-[13px] leading-5 text-slate-500">
              Are you sure you want to log out of CampaignHub?
            </p>

            {/* Buttons */}

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={handleCancelLogout}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 rounded-xl bg-[#5A3FD6] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#4C32C2]"
              >
                Logout
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}