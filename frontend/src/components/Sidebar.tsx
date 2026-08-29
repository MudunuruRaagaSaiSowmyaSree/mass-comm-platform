import {
  Icon,
  icons,
} from "./Icon";


/* ============================================================
   USER ROLES
   ============================================================ */

export type UserRole =
  | "admin"
  | "campaign_manager"
  | "comms_team";


/* ============================================================
   APP VIEWS
   ============================================================ */

export type AppView =
  | "dashboard"
  | "userManagement"
  | "campaigns"
  | "teamMembers"
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


/* ============================================================
   SIDEBAR PROPS
   ============================================================ */

interface SidebarProps {
  active: AppView;

  onNavigate: (
    view: AppView
  ) => void;

  userEmail: string;

  userRole: UserRole;

  onLogout: () => void;
}


/* ============================================================
   MENU ITEM
   ============================================================ */

interface MenuItem {
  key: AppView;

  label: string;

  icon: string;

  roles: UserRole[];
}


/* ============================================================
   ROLE GROUPS
   ============================================================ */

const ALL_ROLES: UserRole[] = [
  "admin",
  "campaign_manager",
  "comms_team",
];


const ADMIN_ONLY: UserRole[] = [
  "admin",
];


const ADMIN_MANAGER: UserRole[] = [
  "admin",
  "campaign_manager",
];


const ADMIN_MANAGER_PERSON: UserRole[] = [
  "admin",
  "campaign_manager",
  "comms_team",
];


const MANAGER_ONLY: UserRole[] = [
  "campaign_manager",
];


const MANAGER_PERSON: UserRole[] = [
  "campaign_manager",
  "comms_team",
];


/* ============================================================
   NAVIGATION
   ============================================================ */

const MENU_ITEMS: MenuItem[] = [

  /* ----------------------------------------------------------
     DASHBOARD
     ---------------------------------------------------------- */

  {
    key: "dashboard",
    label: "Dashboard",
    icon: icons.grid,
    roles: ALL_ROLES,
  },


  /* ----------------------------------------------------------
     ADMIN - USER MANAGEMENT
     ---------------------------------------------------------- */

  {
    key: "userManagement",
    label: "User Management",
    icon: icons.users,
    roles: ADMIN_ONLY,
  },


  /* ----------------------------------------------------------
     CAMPAIGNS
     ---------------------------------------------------------- */

  {
    key: "campaigns",
    label: "Campaigns",
    icon: icons.megaphone,
    roles: ADMIN_MANAGER_PERSON,
  },


  /* ----------------------------------------------------------
     MANAGER - TEAM MEMBERS
     ---------------------------------------------------------- */

  {
    key: "teamMembers",
    label: "Team Members",
    icon: icons.users,
    roles: MANAGER_ONLY,
  },


  /* ----------------------------------------------------------
     AI CONTENT STUDIO
     
     Manager + Campaign Person
     NOT Admin
     ---------------------------------------------------------- */

  {
    key: "aiStudio",
    label: "AI Content Studio",
    icon: icons.sparkle,
    roles: MANAGER_PERSON,
  },


  /* ----------------------------------------------------------
     CAMPAIGN PIPELINE
     
     Admin + Manager
     ---------------------------------------------------------- */

  {
    key: "pipeline",
    label: "Campaign Pipeline",
    icon: icons.layout,
    roles: ADMIN_MANAGER,
  },


  /* ----------------------------------------------------------
     TEMPLATES
     
     All authenticated roles
     ---------------------------------------------------------- */

  {
    key: "templates",
    label: "Templates",
    icon: icons.layout,
    roles: ADMIN_MANAGER_PERSON,
  },


  /* ----------------------------------------------------------
     AUDIENCE
     
     REMOVED FROM NAVIGATION
     
     The AppView type still contains "audience" for
     compatibility with existing code, but there is
     intentionally no menu item here.
     ---------------------------------------------------------- */


  /* ----------------------------------------------------------
     VOICE ASSISTANT
     
     ALL ROLES
     ---------------------------------------------------------- */

  {
    key: "voice",
    label: "Voice Assistant",
    icon: icons.mic,
    roles: [
      "campaign_manager",
      "comms_team",
    ],
  },


  /* ----------------------------------------------------------
     TRANSLATIONS
     
     Manager + Campaign Person
     NOT Admin
     ---------------------------------------------------------- */

  {
    key: "translations",
    label: "Translations",
    icon: icons.globe,
    roles: MANAGER_PERSON,
  },


  /* ----------------------------------------------------------
     COMPLIANCE
     
     Manager + Campaign Person
     NOT Admin
     ---------------------------------------------------------- */

  {
    key: "compliance",
    label: "Compliance",
    icon: icons.shield,
    roles: MANAGER_PERSON,
  },


  /* ----------------------------------------------------------
     CONTENT REVIEW
     
     All roles
     ---------------------------------------------------------- */

  {
    key: "review",
    label: "Content Review",
    icon: icons.clock,
    roles: ALL_ROLES,
  },


  /* ----------------------------------------------------------
     AI CHAT ASSISTANT
     
     ALL ROLES
     ---------------------------------------------------------- */

  {
    key: "chat",
    label: "AI Chat Assistant",
    icon: icons.sparkle,
    roles: ALL_ROLES,
  },


  /* ----------------------------------------------------------
     CHAT HISTORY
     
     ALL ROLES
     ---------------------------------------------------------- */

  {
    key: "chatHistory",
    label: "Chat History",
    icon: icons.clock,
    roles: ALL_ROLES,
  },


  /* ----------------------------------------------------------
     REPORTS
     
     ALL ROLES
     ---------------------------------------------------------- */

  {
    key: "reports",
    label: "Reports",
    icon: icons.chart,
    roles: ALL_ROLES,
  },


  /* ----------------------------------------------------------
     SETTINGS
     
     Admin + Manager
     NOT Campaign Person
     ---------------------------------------------------------- */

  {
    key: "settings",
    label: "Settings",
    icon: icons.settings,
    roles: ADMIN_MANAGER,
  },
];


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
   SIDEBAR
   ============================================================ */

export default function Sidebar({
  active,
  onNavigate,
  userEmail,
  userRole,
  onLogout,
}: SidebarProps) {

  /* ==========================================================
     FILTER MENU BY ROLE
     ========================================================== */

  const visibleItems =
    MENU_ITEMS.filter(
      (item) =>
        item.roles.includes(
          userRole
        )
    );


  /* ==========================================================
     INITIALS
     ========================================================== */

  const initials =
    userEmail
      .split("@")[0]
      .trim()
      .split(
        /[\s._-]+/
      )
      .filter(Boolean)
      .slice(
        0,
        2
      )
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .toUpperCase() ||
    "U";


  /* ==========================================================
     NAVIGATION
     ========================================================== */

  function handleNavigate(
    view: AppView
  ) {

    onNavigate(
      view
    );


    /*
     * Keep the existing custom navigation
     * event system working.
     */

    window.dispatchEvent(
      new CustomEvent(
        "navigate-view",
        {
          detail:
            view,
        }
      )
    );
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <aside
      className="
        flex
        h-screen
        w-[218px]
        flex-shrink-0
        flex-col
        bg-[#4032C5]
        text-white
      "
    >

      {/* ======================================================
         BRAND
         ====================================================== */}

      <div
        className="
          flex
          h-[76px]
          items-center
          px-4
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              flex-shrink-0
              items-center
              justify-center
              rounded-xl
              bg-white/15
            "
          >

            <Icon
              path={
                icons.megaphone
              }
              className="h-5 w-5 text-white"
            />

          </div>


          <div className="min-w-0">

            <p
              className="
                truncate
                text-[16px]
                font-bold
                leading-tight
                text-white
              "
            >
              CampaignHub
            </p>

            <p
              className="
                mt-0.5
                text-[9px]
                leading-tight
                text-indigo-100
              "
            >
              Mass Communication
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
         NAVIGATION
         ====================================================== */}

      <nav
        className="
          flex-1
          overflow-y-auto
          px-3
          py-4
        "
      >

        <div className="space-y-1">

          {visibleItems.map(
            (
              item
            ) => {

              const selected =
                active ===
                item.key;


              return (
                <button
                  key={
                    item.key
                  }
                  type="button"
                  onClick={() =>
                    handleNavigate(
                      item.key
                    )
                  }
                  className={`
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-[12px]
                    font-semibold
                    transition
                    ${
                      selected
                        ? "bg-white text-[#4032C5]"
                        : "text-white hover:bg-white/10"
                    }
                  `}
                >

                  <Icon
                    path={
                      item.icon
                    }
                    className={`
                      h-[17px]
                      w-[17px]
                      flex-shrink-0
                      ${
                        selected
                          ? "text-[#4032C5]"
                          : "text-white"
                      }
                    `}
                  />


                  <span className="truncate">
                    {
                      item.label
                    }
                  </span>

                </button>
              );
            }
          )}

        </div>

      </nav>


      {/* ======================================================
         ACCOUNT
         ====================================================== */}

      <div
        className="
          border-t
          border-white/10
          p-3
        "
      >

        <div
          className="
            rounded-xl
            bg-white/10
            p-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-2.5
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                flex-shrink-0
                items-center
                justify-center
                rounded-full
                bg-white/15
                text-[10px]
                font-bold
                text-white
              "
            >
              {
                initials
              }
            </div>


            <div
              className="
                min-w-0
                flex-1
              "
            >

              <p
                className="
                  truncate
                  text-[11px]
                  font-semibold
                  text-white
                "
              >
                {
                  ROLE_LABELS[
                    userRole
                  ]
                }
              </p>

              <p
                className="
                  truncate
                  text-[9px]
                  text-indigo-100
                "
              >
                {
                  userEmail
                }
              </p>

            </div>

          </div>


          {/* ==================================================
             LOGOUT
             ================================================== */}

          <button
            type="button"
            onClick={
              onLogout
            }
            className="
              mt-3
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-white/10
              px-3
              py-2
              text-[10px]
              font-semibold
              text-white
              transition
              hover:bg-white
              hover:text-[#4032C5]
            "
          >

            <span className="text-[12px]">
              ↪
            </span>

            Logout

          </button>

        </div>

      </div>

    </aside>
  );
}