import { useEffect, useState } from "react";
import "./styles/App.css";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import AudienceManager from "./pages/AudienceManager";
import Dashboard from "./pages/Dashboard";
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

import VoiceAssistant from "./components/VoiceAssistant";
import Sidebar, {
  type AppView,
} from "./components/Sidebar";

import {
  fetchCurrentUser,
  type CurrentUser,
} from "./api/auth";

import { setAuthToken } from "./api/client";

type Screen =
  | "login"
  | "reset-password"
  | "register"
  | "app";

function App() {
  /* ============================================================
     SCREEN
     ============================================================ */

  const [screen, setScreen] =
    useState<Screen>("login");

  const [resetToken, setResetToken] =
    useState("");

  /* ============================================================
     ACTIVE VIEW
     ============================================================ */

  const [view, setView] =
    useState<AppView>("dashboard");

  /* ============================================================
     CURRENT USER
     ============================================================ */

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  /* ============================================================
     LOAD CURRENT USER
     ============================================================ */

  useEffect(() => {
    if (screen !== "app" || user) {
      return;
    }

    fetchCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        setUser(null);
        setAuthToken(null);
        setScreen("login");
      });
  }, [screen, user]);

  /* ============================================================
     ROLE-BASED PAGE PROTECTION
     ============================================================ */

  useEffect(() => {
    if (!user) {
      return;
    }

    const isAdmin =
      user.role === "admin";

    const isCampaignManager =
      user.role === "campaign_manager";

    /*
     * Campaigns
     *
     * All authenticated users can view campaigns.
     */

    const canViewCampaigns = true;

    /*
     * Campaign management
     *
     * Admin + Campaign Manager.
     */

    const canManageCampaigns =
      isAdmin || isCampaignManager;

    /*
     * Audience
     *
     * Admin + Campaign Manager.
     */

    const canManageAudience =
      isAdmin || isCampaignManager;

    /* ----------------------------------------------------------
       Campaign protection
       ---------------------------------------------------------- */

    if (
      view === "campaigns" &&
      !canViewCampaigns
    ) {
      setView("dashboard");
      return;
    }

    /* ----------------------------------------------------------
       Audience protection
       ---------------------------------------------------------- */

    if (
      view === "audience" &&
      !canManageAudience
    ) {
      setView("dashboard");
      return;
    }

    /* ----------------------------------------------------------
       Compliance protection
       ---------------------------------------------------------- */

    if (
      view === "compliance" &&
      !isAdmin
    ) {
      setView("dashboard");
      return;
    }

    /* ----------------------------------------------------------
       Settings protection
       ---------------------------------------------------------- */

    if (
      view === "settings" &&
      !isAdmin
    ) {
      setView("dashboard");
      return;
    }

    /*
     * Keep this variable intentionally referenced so permission
     * calculation remains explicit.
     */

    void canManageCampaigns;
  }, [view, user]);

  /* ============================================================
     NAVIGATION EVENTS
     ============================================================ */

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

      setView(nextView);
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

  /* ============================================================
     LOGIN SCREEN
     ============================================================ */

  if (screen === "login") {
    return (
      <Login
        onSuccess={() => {
          setScreen("app");
          setView("dashboard");
        }}
        onSwitchToRegister={() => {
          setScreen("register");
        }}
        onResetPassword={(token: string) => {
          setResetToken(token);
          setScreen("reset-password");
        }}
      />
    );
  }

  /* ============================================================
     RESET PASSWORD SCREEN
     ============================================================ */

  if (screen === "reset-password") {
    return (
      <ResetPassword
        token={resetToken}
        onBackToLogin={() => {
          setResetToken("");
          setScreen("login");
        }}
      />
    );
  }

  /* ============================================================
     REGISTER SCREEN
     ============================================================ */

  if (screen === "register") {
    return (
      <Register
        onSuccess={() => {
          setScreen("login");
        }}
        onBack={() => {
          setScreen("login");
        }}
      />
    );
  }

  /* ============================================================
     WAIT FOR CURRENT USER
     ============================================================ */

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <p className="text-[13px] text-slate-500">
          Loading your account...
        </p>
      </div>
    );
  }

  /* ============================================================
     USER INFORMATION
     ============================================================ */

  const userEmail =
    user.email;

  /* ============================================================
     ROLE HELPERS
     ============================================================ */

  const isAdmin =
    user.role === "admin";

  const isCampaignManager =
    user.role === "campaign_manager";

  /* ============================================================
     PERMISSIONS
     ============================================================ */

  /*
   * Campaigns
   */

  const canViewCampaigns = true;

  const canManageCampaigns =
    isAdmin || isCampaignManager;

  /*
   * Templates
   *
   * Admin + Campaign Manager can create.
   *
   * Admin can manage.
   */

  const canCreateTemplates =
    isAdmin || isCampaignManager;

  const canManageTemplates =
    isAdmin;

  /*
   * Audience
   */

  const canManageAudience =
    isAdmin || isCampaignManager;

  /* ============================================================
     LOGOUT
     ============================================================ */

  function handleLogout() {
    setAuthToken(null);
    setUser(null);
    setView("dashboard");
    setScreen("login");
  }

  /* ============================================================
     MAIN APPLICATION
     ============================================================ */

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ======================================================
         SIDEBAR
         ====================================================== */}

      <Sidebar
        active={view}
        onNavigate={setView}
        userEmail={userEmail}
        userRole={user.role}
        onLogout={handleLogout}
      />

      {/* ======================================================
         DASHBOARD
         ====================================================== */}

      {view === "dashboard" && (
        <Dashboard
          userEmail={userEmail}
        />
      )}

      {/* ======================================================
         CAMPAIGNS
         ====================================================== */}

      {view === "campaigns" &&
        canViewCampaigns && (
          <Campaigns
            canCreateCampaigns={
              canManageCampaigns
            }
          />
        )}

      {/* ======================================================
         AI CONTENT STUDIO
         ====================================================== */}

      {view === "aiStudio" && (
        <AIStudio />
      )}

      {/* ======================================================
         CAMPAIGN PIPELINE
         ====================================================== */}

      {view === "pipeline" && (
        <Pipeline />
      )}

      {/* ======================================================
         CONTENT REVIEW
         ====================================================== */}

      {view === "review" && (
        <Review />
      )}

      {/* ======================================================
         TEMPLATES
         ====================================================== */}

      {view === "templates" && (
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
         ====================================================== */}

      {view === "audience" &&
        canManageAudience && (
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <AudienceManager
              currentUser={userEmail}
            />
          </div>
        )}

      {/* ======================================================
         VOICE ASSISTANT
         ====================================================== */}

      {view === "voice" && (
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <VoiceAssistant />
        </div>
      )}

      {/* ======================================================
         TRANSLATIONS
         ====================================================== */}

      {view === "translations" && (
        <Translations />
      )}

      {/* ======================================================
         COMPLIANCE
         ====================================================== */}

      {view === "compliance" &&
        isAdmin && (
          <Compliance />
        )}

      {/* ======================================================
         AI CHAT ASSISTANT
         ====================================================== */}

      {view === "chat" && (
        <Chat
          userId={user.id}
        />
      )}

      {/* ======================================================
         CHAT HISTORY
         ====================================================== */}

      {view === "chatHistory" && (
        <ChatHistory
          userId={user.id}
        />
      )}

      {/* ======================================================
         REPORTS
         ====================================================== */}

      {view === "reports" && (
        <Reports />
      )}

      {/* ======================================================
         SETTINGS
         ====================================================== */}

      {view === "settings" &&
        isAdmin && (
          <Settings
            user={user}
          />
        )}

    </div>
  );
}

export default App;