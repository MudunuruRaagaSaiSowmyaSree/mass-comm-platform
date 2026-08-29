import {
  useEffect,
  useState,
} from "react";

import "./styles/App.css";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Campaigns from "./pages/Campaigns";
import AIStudio from "./pages/AIStudio";
import Pipeline from "./pages/Pipeline";
import Templates from "./pages/Templates";
import Translations from "./pages/Translations";
import Compliance from "./pages/Compliance";
import Review from "./pages/Review";
import ChatHistory from "./pages/ChatHistory";
import Chat from "./pages/Chat";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import TeamMembers from "./pages/TeamMembers";
import AudienceManager from "./pages/AudienceManager";
import VoiceAssistant from "./components/VoiceAssistant";

import Sidebar, {
  type AppView,
} from "./components/Sidebar";

import {
  fetchCurrentUser,
  type CurrentUser,
} from "./api/auth";

import {
  setAuthToken,
} from "./api/client";


/* ============================================================
   SCREEN
   ============================================================ */

type Screen =
  | "login"
  | "reset-password"
  | "register"
  | "app";


/* ============================================================
   APP
   ============================================================ */

function App() {

  /* ==========================================================
     SCREEN
     ========================================================== */

  const [screen, setScreen] =
    useState<Screen>("login");

  const [resetToken, setResetToken] =
    useState("");


  /* ==========================================================
     ACTIVE VIEW
     ========================================================== */

  const [view, setView] =
    useState<AppView>("dashboard");


  /* ==========================================================
     CURRENT USER
     ========================================================== */

  const [user, setUser] =
    useState<CurrentUser | null>(null);


  /* ==========================================================
     ROLE FLAGS
     ========================================================== */

  const isAdmin =
    user?.role === "admin";

  const isCampaignManager =
    user?.role === "campaign_manager";


  /* ==========================================================
     LOAD CURRENT USER
     ========================================================== */

  useEffect(() => {

    if (
      screen !== "app" ||
      user
    ) {
      return;
    }

    fetchCurrentUser()
      .then(
        (
          currentUser
        ) => {

          setUser(
            currentUser
          );

        }
      )
      .catch(() => {

        setUser(null);

        setAuthToken(
          null
        );

        setScreen(
          "login"
        );

        setView(
          "dashboard"
        );

      });

  }, [
    screen,
    user,
  ]);


  /* ==========================================================
     NAVIGATION EVENT
     ========================================================== */

  useEffect(() => {

    function handleNavigation(
      event: Event
    ) {

      const customEvent =
        event as CustomEvent<AppView>;

      const nextView =
        customEvent.detail;

      if (!nextView) {
        return;
      }

      setView(
        nextView
      );

    }


    window.addEventListener(
      "navigate-view",
      handleNavigation
    );


    return () => {

      window.removeEventListener(
        "navigate-view",
        handleNavigation
      );

    };

  }, []);


  /* ==========================================================
     ROLE BASED NAVIGATION PROTECTION
     ========================================================== */

  useEffect(() => {

    if (!user) {
      return;
    }


    /* ========================================================
       ADMIN
       ======================================================== */

    if (
      user.role === "admin"
    ) {

      /*
       * Admin does NOT have access to:
       *
       * AI Content Studio
       * Translations
       * Compliance
       *
       * Those views are also removed from the Admin sidebar.
       */

      const adminBlockedViews:
        AppView[] = [
          "aiStudio",
          "translations",
          "compliance",
          "voice",
        ];


      if (
        adminBlockedViews.includes(
          view
        )
      ) {

        setView(
          "dashboard"
        );

        return;
      }


      /*
       * Admin can access everything else,
       * including User Management.
       */

      return;
    }


    /* ========================================================
       MANAGER
       ======================================================== */

    if (
      user.role ===
      "campaign_manager"
    ) {

      const managerBlockedViews:
        AppView[] = [

          /*
           * Admin-only
           */
          "userManagement",

          /*
           * Audience has been removed
           * from navigation.
           */
          "audience",

        ];


      if (
        managerBlockedViews.includes(
          view
        )
      ) {

        setView(
          "dashboard"
        );

        return;
      }


      /*
       * Manager CAN access:
       *
       * Dashboard
       * Campaigns
       * Team Members
       * AI Content Studio
       * Campaign Pipeline
       * Templates
       * Voice Assistant
       * Translations
       * Compliance
       * Content Review
       * AI Chat Assistant
       * Chat History
       * Reports
       * Settings
       */

      return;
    }


    /* ========================================================
       CAMPAIGN PERSON
       ======================================================== */

    if (
      user.role ===
      "comms_team"
    ) {

      const campaignPersonBlockedViews:
        AppView[] = [

          /*
           * Admin-only
           */
          "userManagement",

          /*
           * Removed from navigation.
           */
          "audience",

          /*
           * Manager-only
           */
          "teamMembers",

          /*
           * Manager-only
           */
          "pipeline",

          /*
           * Settings is not available
           * for Campaign Person.
           */
          "settings",

        ];


      if (
        campaignPersonBlockedViews.includes(
          view
        )
      ) {

        setView(
          "dashboard"
        );

        return;
      }


      /*
       * Campaign Person CAN access:
       *
       * Dashboard
       * Campaigns
       * AI Content Studio
       * Templates
       * Voice Assistant
       * Translations
       * Compliance
       * Content Review
       * AI Chat Assistant
       * Chat History
       * Reports
       */

      return;
    }


  }, [
    user,
    view,
  ]);


  /* ==========================================================
     PERMISSIONS
     ========================================================== */

  /*
   * All authenticated roles can view campaigns.
   */

  const canViewCampaigns =
    Boolean(user);


  /*
   * Admin + Manager can create/manage campaigns.
   */

  const canManageCampaigns =
    isAdmin ||
    isCampaignManager;


  /*
   * Audience permission retained for existing
   * application compatibility.
   *
   * Audience is no longer shown in the sidebar.
   */

  const canManageAudience =
    isAdmin ||
    isCampaignManager;


  /*
   * Admin + Manager can create templates.
   */

  const canCreateTemplates =
    isAdmin ||
    isCampaignManager;


  /*
   * Only Admin can perform full template management.
   */

  const canManageTemplates =
    isAdmin;


  /* ==========================================================
     LOGOUT
     ========================================================== */

  function handleLogout() {

    setAuthToken(
      null
    );

    setUser(
      null
    );

    setView(
      "dashboard"
    );

    setScreen(
      "login"
    );

  }


  /* ==========================================================
     LOGIN
     ========================================================== */

  if (
    screen === "login"
  ) {

    return (
      <Login

        onSuccess={() => {

          setView(
            "dashboard"
          );

          setScreen(
            "app"
          );

        }}

        onSwitchToRegister={() => {

          setScreen(
            "register"
          );

        }}

        onResetPassword={(
          token: string
        ) => {

          setResetToken(
            token
          );

          setScreen(
            "reset-password"
          );

        }}

      />
    );

  }


  /* ==========================================================
     RESET PASSWORD
     ========================================================== */

  if (
    screen ===
    "reset-password"
  ) {

    return (
      <ResetPassword

        token={
          resetToken
        }

        onBackToLogin={() => {

          setResetToken("");

          setScreen(
            "login"
          );

        }}

      />
    );

  }


  /* ==========================================================
     REGISTER
     ========================================================== */

  if (
    screen ===
    "register"
  ) {

    return (
      <Register

        onSuccess={() => {

          setScreen(
            "login"
          );

        }}

        onBack={() => {

          setScreen(
            "login"
          );

        }}

      />
    );

  }


  /* ==========================================================
     WAIT FOR CURRENT USER
     ========================================================== */

  if (!user) {

    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">

        <p className="text-[13px] text-slate-500">
          Loading your account...
        </p>

      </div>
    );

  }


  /* ==========================================================
     MAIN APPLICATION
     ========================================================== */

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ======================================================
         SIDEBAR
         ====================================================== */}

      <Sidebar

        active={
          view
        }

        onNavigate={
          setView
        }

        userEmail={
          user.email
        }

        userRole={
          user.role
        }

        onLogout={
          handleLogout
        }

      />


      {/* ======================================================
         DASHBOARD
         ====================================================== */}

      {view ===
        "dashboard" && (

        <Dashboard

          userEmail={
            user.email
          }

          userRole={
            user.role
          }

        />

      )}


      {/* ======================================================
         USER MANAGEMENT
         
         Admin only.
         Uses the real UserManagement page.
         ====================================================== */}

      {view ===
        "userManagement" &&
        isAdmin && (

        <UserManagement />

      )}


      {/* ======================================================
         CAMPAIGNS
         ====================================================== */}

      {view ===
        "campaigns" &&
        canViewCampaigns && (

        <Campaigns

          canCreateCampaigns={
            canManageCampaigns
          }

        />

      )}


      {/* ======================================================
         TEAM MEMBERS
         
         Manager only.
         ====================================================== */}

      {view ===
        "teamMembers" &&
        isCampaignManager && (

        <TeamMembers

          currentUserEmail={
            user.email
          }

        />

      )}


      {/* ======================================================
         AI CONTENT STUDIO
         
         Manager + Campaign Person.
         
         Admin is blocked above.
         ====================================================== */}

      {view ===
        "aiStudio" &&
        !isAdmin && (

        <AIStudio />

      )}


      {/* ======================================================
         CAMPAIGN PIPELINE
         
         Admin + Manager.
         ====================================================== */}

      {view ===
        "pipeline" &&
        (
          isAdmin ||
          isCampaignManager
        ) && (

        <Pipeline />

      )}


      {/* ======================================================
         TEMPLATES
         ====================================================== */}

      {view ===
        "templates" && (

        <Templates

          canCreateTemplates={
            canCreateTemplates
          }

          canManageTemplates={
            canManageTemplates
          }

        />

      )}


      {/* ======================================================
         AUDIENCE
         
         Hidden from sidebar.
         Existing route retained for compatibility.
         ====================================================== */}

      {view ===
        "audience" &&
        canManageAudience && (

        <div className="flex-1 overflow-y-auto bg-slate-50">

          <AudienceManager

            currentUser={
              user.email
            }

          />

        </div>

      )}


      {/* ======================================================
         VOICE ASSISTANT
         
         Available to:
         - Admin
         - Manager
         - Campaign Person
         ====================================================== */}

      {view ===
        "voice" && (

        <div className="flex-1 overflow-y-auto bg-slate-50">

          <VoiceAssistant />

        </div>

      )}


      {/* ======================================================
         TRANSLATIONS
         
         Manager + Campaign Person.
         
         Admin is blocked above.
         ====================================================== */}

      {view ===
        "translations" &&
        !isAdmin && (

        <Translations />

      )}


      {/* ======================================================
         COMPLIANCE
         
         Manager + Campaign Person.
         
         Admin is blocked above.
         ====================================================== */}

      {view ===
        "compliance" &&
        !isAdmin && (

        <Compliance />

      )}


      {/* ======================================================
         CONTENT REVIEW
         ====================================================== */}

      {view ===
        "review" && (

        <Review />

      )}


      {/* ======================================================
         AI CHAT ASSISTANT
         
         Available to all three roles.
         ====================================================== */}

      {view ===
        "chat" && (

        <Chat

          userId={
            user.id
          }

        />

      )}


      {/* ======================================================
         CHAT HISTORY
         ====================================================== */}

      {view ===
        "chatHistory" && (

        <ChatHistory

          userId={
            user.id
          }

        />

      )}


      {/* ======================================================
         REPORTS
         ====================================================== */}

      {view ===
        "reports" && (

        <Reports />

      )}


      {/* ======================================================
         SETTINGS
         
         Admin + Manager.
         ====================================================== */}

      {view ===
        "settings" &&
        (
          isAdmin ||
          isCampaignManager
        ) && (

        <Settings

          user={
            user
          }

        />

      )}

    </div>
  );
}


export default App;