import { useState } from "react";
import { setAuthToken } from "../api/client";
import { loginUser, fetchCurrentUser } from "../api/auth";

/* ------------------------------------------------------------------ */
/*  Small inline icon set                                               */
/* ------------------------------------------------------------------ */

function Icon({
  path,
  className = "w-5 h-5",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
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

  leaf: "M4 20c8 0 14-6 14-14V4h-2C8 4 4 10 4 18v2Zm0 0c2-3 5-5 9-6",

  heart:
    "M12 20s-7-4.4-9.5-9C1 7.5 2.5 4 6 4c2 0 3.5 1.2 4 2.3C10.5 5.2 12 4 14 4c3.5 0 5 3.5 3.5 7C15 15.6 12 20 12 20Z",

  cloud:
    "M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 17.5 12 3.5 3.5 0 0 1 17 18H7Z",

  building:
    "M4 21V7l8-4 8 4v14M4 21h16M9 21v-5h6v5M9 10h.01M15 10h.01M9 14h.01M15 14h.01",

  rupee:
    "M6 4h12M6 4c4 0 6 1.5 6 4.2S10 12.4 6 12.4h6L18 20M6 8.2h12",

  cart:
    "M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6.2M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",

  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2 0 4-4 4-9s-1.8-9-4-9-4 4-4 9 1.8 9 4 9ZM3.6 9h16.8M3.6 15h16.8",

  wifi:
    "M2.5 9.5a15 15 0 0 1 19 0M6 13a10 10 0 0 1 12 0M9.5 16.5a5 5 0 0 1 5 0M12 20h.01",

  headset:
    "M4 13v-1a8 8 0 0 1 16 0v1M4 13v4a2 2 0 0 0 2 2h1v-7H5a1 1 0 0 0-1 1Zm16 0v4a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1Zm-4 6a3 3 0 0 1-3 2h-1",

  shield:
    "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Zm-3 9 2 2 4-4",

  user:
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",

  lock:
    "M6 11V8a6 6 0 1 1 12 0v3M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm7 5v2",

  eye:
    "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",

  eyeOff:
    "M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a13.8 13.8 0 0 1-3.2 4.1M6.5 6.5C4 8.1 2 12 2 12a13.9 13.9 0 0 0 5.1 5.6",

  arrowRight: "M5 12h14M13 6l6 6-6 6",

  chevronDown: "M6 9l6 6 6-6",

  phone:
    "M4 5c0-1 1-2 2-2h2l2 5-2 1.5A11 11 0 0 0 13.5 15l1.5-2 5 2v2c0 1-1 2-2 2C10 19 4 13 4 5Z",
};

/* ------------------------------------------------------------------ */
/*  Feature bubble                                                     */
/* ------------------------------------------------------------------ */

function FeatureBubble({
  icon,
  color,
  title,
  subtitle,
  position,
}: {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  position: string;
}) {
  return (
    <div
      className={`absolute ${position} flex w-[124px] flex-col items-center gap-1 text-center`}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
        style={{ backgroundColor: color }}
      >
        <Icon path={icon} className="h-4 w-4 text-white" />
      </div>

      <p className="text-[12px] font-semibold leading-tight text-slate-800">
        {title}
      </p>

      <p className="text-[10.5px] leading-tight text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Brand panel                                                        */
/* ------------------------------------------------------------------ */

function BrandPanel() {
  return (
    <div className="relative hidden w-[46%] min-w-[440px] flex-col overflow-hidden rounded-l-[28px] bg-[#f4f1fb] p-9 lg:flex">
      <div className="pointer-events-none absolute inset-0">
        <svg
          viewBox="0 0 600 700"
          className="absolute -bottom-6 left-0 h-[62%] w-full"
          preserveAspectRatio="xMidYMax slice"
        >
          <path
            d="M0 260 L120 170 L230 250 L340 150 L470 240 L600 190 L600 700 L0 700 Z"
            fill="#e4defa"
          />

          <path
            d="M0 320 L100 260 L210 320 L300 260 L420 330 L520 270 L600 310 L600 700 L0 700 Z"
            fill="#d8cff5"
            opacity="0.7"
          />
        </svg>

        <svg
          className="absolute right-10 top-14 h-9 w-14 text-[#c8bdf0]"
          viewBox="0 0 60 30"
          fill="none"
        >
          <path
            d="M4 22l7-7 5 5 8-9 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          className="absolute left-16 top-24 h-6 w-6 text-[#b9adf0]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M3 12c3-3 5-3 7 0s4 3 7 0 5-3 7 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C6CF0] to-[#5A3FD6] shadow-md">
          <Icon path={paths.mic} className="h-4 w-4 text-white" />
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

      <div className="relative z-10 mt-9">
        <h1 className="text-[27px] font-extrabold leading-tight text-slate-900">
          Your Voice.
          <br />
          <span className="text-[#5A3FD6]">Our Knowledge.</span>
          <br />
          <span className="text-[#5A3FD6]">
            Smarter Communities.
          </span>
        </h1>

        <p className="mt-3 max-w-[360px] text-[13px] leading-relaxed text-slate-500">
          VoiceAssist is your multilingual AI companion for agriculture,
          healthcare, schemes, banking, weather and more &ndash; built for
          rural India.
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-4 h-[300px] w-[380px]">
        <FeatureBubble
          icon={paths.leaf}
          color="#3AAE58"
          title="Agriculture"
          subtitle="Crop advice, tips & best practices"
          position="left-[108px] top-0"
        />

        <FeatureBubble
          icon={paths.heart}
          color="#EF4B6E"
          title="Healthcare"
          subtitle="Health info & wellness support"
          position="right-[-6px] top-2"
        />

        <FeatureBubble
          icon={paths.cloud}
          color="#3B8FF3"
          title="Weather"
          subtitle="Live updates & forecasts"
          position="left-[-16px] top-[108px]"
        />

        <FeatureBubble
          icon={paths.building}
          color="#F0942F"
          title="Schemes"
          subtitle="Govt schemes & benefits"
          position="right-[-14px] top-[112px]"
        />

        <FeatureBubble
          icon={paths.rupee}
          color="#8B5CF6"
          title="Banking"
          subtitle="Banking basics & financial literacy"
          position="left-[38px] top-[214px]"
        />

        <FeatureBubble
          icon={paths.cart}
          color="#EC5AA7"
          title="Market Prices"
          subtitle="Mandi prices & market trends"
          position="right-[26px] top-[214px]"
        />

        <div className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#7C6CF0] to-[#5A3FD6] shadow-lg shadow-[#6C5CE7]/30">
          <Icon path={paths.mic} className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="relative z-10 mt-auto grid grid-cols-4 gap-2 border-t border-slate-200/70 pt-4">
        {[
          {
            icon: paths.globe,
            title: "Multilingual",
            sub: "14+ Indian Languages",
          },
          {
            icon: paths.wifi,
            title: "Offline First",
            sub: "Works even in low connectivity",
          },
          {
            icon: paths.headset,
            title: "Voice & Text",
            sub: "Speak or type, your choice",
          },
          {
            icon: paths.shield,
            title: "Trusted Info",
            sub: "Reliable & verified information",
          },
        ].map((b) => (
          <div
            key={b.title}
            className="flex flex-col items-center gap-1 text-center"
          >
            <Icon path={b.icon} className="h-4 w-4 text-[#6C5CE7]" />

            <p className="text-[10.5px] font-semibold leading-tight text-slate-700">
              {b.title}
            </p>

            <p className="text-[9px] leading-tight text-slate-400">
              {b.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Languages                                                          */
/* ------------------------------------------------------------------ */

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
];

/* ------------------------------------------------------------------ */
/*  Sign in panel                                                      */
/* ------------------------------------------------------------------ */

function SignInPanel({
  onSuccess,
  onSwitchToRegister,
}: {
  onSuccess: (name: string) => void;
  onSwitchToRegister: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [language, setLanguage] = useState("en");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      /* ------------------------------------------------------------ */
      /* 1. Login                                                     */
      /* ------------------------------------------------------------ */

      const data = await loginUser(
        identifier.trim(),
        password
      );

      /* ------------------------------------------------------------ */
      /* 2. Save access token                                         */
      /* ------------------------------------------------------------ */

      if (!data.access_token) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      setAuthToken(data.access_token);

      /* ------------------------------------------------------------ */
      /* 3. Get current user                                         */
      /* ------------------------------------------------------------ */

      const currentUser = await fetchCurrentUser();

      /* ------------------------------------------------------------ */
      /* 4. Continue into application                                */
      /* ------------------------------------------------------------ */

      const displayName =
        currentUser.name?.trim() ||
        currentUser.email ||
        identifier.trim();

      onSuccess(displayName);
    } catch (err: any) {
      console.error("Login failed:", err);

      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (err?.response?.status === 401) {
        setError("Invalid username or password.");
      } else {
        setError(
          err?.message ||
            "Login failed. Please check your backend and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-10 lg:w-[54%]">
      <div className="w-full max-w-[380px]">
        <div className="text-center">
          <h2 className="text-[24px] font-extrabold text-slate-900">
            Welcome Back!
          </h2>

          <p className="mt-1 text-[13px] text-slate-500">
            Sign in to continue to{" "}
            <span className="font-semibold text-[#5A3FD6]">
              VoiceAssist
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
          <div className="relative">
            <Icon
              path={paths.user}
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Username or Email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-3.5 text-[13.5px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
          </div>

          <div className="relative">
            <Icon
              path={paths.lock}
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />

            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-11 text-[13.5px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              <Icon
                path={
                  showPassword
                    ? paths.eyeOff
                    : paths.eye
                }
                className="h-4 w-4"
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-0.5 text-[12.5px]">
            <label className="flex items-center gap-2 text-slate-500">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(e.target.checked)
                }
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#6C5CE7] focus:ring-[#6C5CE7]"
              />

              Remember me
            </label>

            <a
              href="#"
              className="font-medium text-[#6C5CE7] hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 px-3 py-2.5 text-[12.5px] text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-3 text-[13.5px] font-semibold text-white shadow-md shadow-[#6C5CE7]/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Login"}

            {!submitting && (
              <Icon
                path={paths.arrowRight}
                className="h-4 w-4"
              />
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[12.5px] text-slate-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-[#6C5CE7] hover:underline"
          >
            Create one
          </button>
        </p>

        <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or continue with
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-[12.5px] font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
              />

              <path
                fill="#34A853"
                d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24Z"
              />

              <path
                fill="#FBBC05"
                d="M5.4 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4A12 12 0 0 0 0 12c0 1.9.5 3.8 1.4 5.4l4-3.1Z"
              />

              <path
                fill="#EA4335"
                d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
              />
            </svg>

            Continue with Google
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-[12.5px] font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Icon
              path={paths.phone}
              className="h-4 w-4 text-slate-500"
            />

            Mobile OTP
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between text-[12px]">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Icon
              path={paths.globe}
              className="h-4 w-4"
            />

            Language / भाषा
          </span>

          <div className="relative">
            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-[12px] font-medium text-[#5A3FD6] outline-none focus:border-[#6C5CE7]"
            >
              {LANGUAGES.map((l) => (
                <option
                  key={l.code}
                  value={l.code}
                >
                  {l.label}
                </option>
              ))}
            </select>

            <Icon
              path={paths.chevronDown}
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
          {LANGUAGES.map((l, i) => (
            <span
              key={l.code}
              className="flex items-center gap-2"
            >
              {i > 0 && (
                <span className="text-slate-300">
                  |
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  setLanguage(l.code)
                }
                className={
                  language === l.code
                    ? "font-semibold text-[#5A3FD6]"
                    : "hover:text-slate-600"
                }
              >
                {l.label}
              </button>
            </span>
          ))}
        </div>
      </div>

      <p className="mt-8 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Icon
          path={paths.shield}
          className="h-3.5 w-3.5"
        />

        Secure. Private. Built for Rural India.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page shell                                                         */
/* ------------------------------------------------------------------ */

export default function Login({
  onSuccess,
  onSwitchToRegister,
}: {
  onSuccess: (name: string) => void;
  onSwitchToRegister: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#8B7CF6] to-[#4C3AC9] p-4 lg:p-8">
      <div className="flex w-full max-w-[980px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <BrandPanel />

        <SignInPanel
          onSuccess={onSuccess}
          onSwitchToRegister={onSwitchToRegister}
        />
      </div>
    </div>
  );
}