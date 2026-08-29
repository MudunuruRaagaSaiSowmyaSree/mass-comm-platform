import { useState } from "react";
import { resetPassword } from "../api/auth";

interface ResetPasswordProps {
  token: string;
  onBackToLogin: () => void;
}

export default function ResetPassword({
  token,
  onBackToLogin,
}: ResetPasswordProps) {
  const [resetToken, setResetToken] = useState(token);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError(null);
    setSuccess(false);

    if (!resetToken.trim()) {
      setError("Please enter your reset token.");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(
        resetToken.trim(),
        newPassword
      );

      setSuccess(true);
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(
        "Reset password failed:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(
          err?.message ||
            "Unable to reset your password."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-7 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0edff] text-[#5A3FD6]">
            🔐
          </div>

          <h1 className="mt-5 text-[24px] font-extrabold text-slate-900">
            Reset Password
          </h1>

          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            Enter the reset token you received and
            choose a new password.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-4"
        >
          {/* RESET TOKEN */}

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-600">
              Reset Token
            </label>

            <input
              type="text"
              required
              value={resetToken}
              onChange={(e) =>
                setResetToken(e.target.value)
              }
              placeholder="Enter reset token"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-[13.5px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
          </div>

          {/* NEW PASSWORD */}

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-600">
              New Password
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              placeholder="Enter new password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-[13.5px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-slate-600">
              Confirm Password
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-[13.5px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-xl bg-rose-50 px-3 py-2.5 text-[12.5px] text-rose-600">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="rounded-xl bg-emerald-50 px-3 py-3 text-[12.5px] text-emerald-700">
              <p className="font-semibold">
                Password reset successfully.
              </p>

              <p className="mt-1">
                You can now log in with your new
                password.
              </p>
            </div>
          )}

          {/* RESET BUTTON */}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-3 text-[13.5px] font-semibold text-white shadow-md shadow-[#6C5CE7]/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Resetting..."
              : "Reset Password"}
          </button>
        </form>

        {/* BACK TO LOGIN */}

        <button
          type="button"
          onClick={onBackToLogin}
          className="mx-auto mt-5 block text-[12.5px] font-semibold text-[#6C5CE7] hover:underline"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}