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

const ADMIN_ONLY: UserRole[] = ["admin"];

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
    roles: ALL_ROLES,
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
    roles: ALL_ROLES,
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

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  campaign_manager: "Campaign Manager",
  comms_team: "User",
};

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
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-gradient-to-b from-[#6C5CE7] to-[#5A3FD6] text-white">

      {/* Logo */}
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

      {/* Navigation */}
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

      {/* User + Logout */}
      <div className="border-t border-white/15 px-4 py-4">

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-[12px] font-semibold uppercase">
            {userEmail.charAt(0) || "U"}
          </div>

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

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[12.5px] font-medium text-white transition hover:bg-white/20"
        >
          <span>↪</span>
          Logout
        </button>

      </div>
    </aside>
  );
}