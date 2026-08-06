import { useState } from "react";
import "./styles/App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AudienceManager from "./pages/AudienceManager";
import VoiceAssistant from "./components/VoiceAssistant";

type View = "login" | "register" | "app" | "voice";

function Icon({ path, className = "w-5 h-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const micPath = "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3m-3 0h6";
const usersPath = "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11 10v-2a4 4 0 0 0-3-3.9M16 3.1A4 4 0 0 1 16 11";

function NavBar({
  active,
  onNavigate,
}: {
  active: "voice" | "app";
  onNavigate: (v: "voice" | "app") => void;
}) {
  const tabClass = (isActive: boolean) =>
    `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-[#6C5CE7] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-8 py-3.5">
      <div className="flex items-center gap-2.5 pr-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C6CF0] to-[#5A3FD6]">
          <Icon path={micPath} className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-bold text-slate-900">VoiceAssist</span>
      </div>

      <button onClick={() => onNavigate("voice")} className={tabClass(active === "voice")}>
        <Icon path={micPath} className="h-4 w-4" />
        Voice Assistant
      </button>
      <button onClick={() => onNavigate("app")} className={tabClass(active === "app")}>
        <Icon path={usersPath} className="h-4 w-4" />
        Audience Manager
      </button>
    </div>
  );
}

function App() {
  const [view, setView] = useState<View>("login");
  const [userName, setUserName] = useState("Raaga Sai");

  if (view === "login") {
    return (
      <Login
        onSuccess={(name: string) => {
          if (name) setUserName(name);
          setView("voice");
        }}
        onSwitchToRegister={() => setView("register")}
      />
    );
  }

  if (view === "register") {
    return (
      <Register
        onSuccess={() => setView("login")}
        onBack={() => setView("login")}
      />
    );
  }

  return (
    <div>
      <NavBar active={view === "voice" ? "voice" : "app"} onNavigate={(v) => setView(v)} />
      {view === "voice" ? <VoiceAssistant /> : <AudienceManager currentUser={userName} />}
    </div>
  );
}

export default App;