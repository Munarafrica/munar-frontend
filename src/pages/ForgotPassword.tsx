import React, { useState, useRef, useEffect } from "react";
import { CardLayout } from "../components/auth/CardLayout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/AuthButton";
import { MailIcon } from "../components/icons";
import { useAuth } from "../contexts";

interface ForgotPasswordProps {
  onNavigate: (page: string) => void;
}

type Step = "email" | "pin" | "done";

export const ForgotPassword = ({ onNavigate }: ForgotPasswordProps) => {
  const { requestPasswordReset } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ─── Step 1: Send email ─────────────────────────────
  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setStep("pin");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset PIN");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Verify PIN → navigate to reset-password ─
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    // Auto-focus next
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newPin.every(d => d !== "") && newPin.join("").length === 6) {
      // Navigate to reset-password with email & PIN in sessionStorage
      sessionStorage.setItem("munar_reset_email", email);
      sessionStorage.setItem("munar_reset_pin", newPin.join(""));
      onNavigate("reset-password");
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newPin = pasted.split("");
      setPin(newPin);
      sessionStorage.setItem("munar_reset_email", email);
      sessionStorage.setItem("munar_reset_pin", pasted);
      onNavigate("reset-password");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setResendCooldown(60);
      setPin(["", "", "", "", "", ""]);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Failed to resend PIN");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────

  if (step === "pin") {
    return (
      <CardLayout>
        <div className="flex flex-col items-center text-center max-w-[400px]">
          {/* Icon */}
          <div className="mb-6">
            <div className="p-1 rounded-[14px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="bg-[#8b5cf6] p-3 rounded-[10px] shadow-[0px_4px_4px_rgba(89,89,89,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 shadow-[inset_2px_4px_4px_rgba(255,255,255,0.25)] rounded-[10px] pointer-events-none" />
                <MailIcon className="text-white size-7" />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Enter Reset PIN</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
            We've sent a 6-digit PIN to
          </p>
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-6">{email}</p>

          {error && (
            <div className="w-full rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400 mb-4">
              {error}
            </div>
          )}

          {/* PIN Input */}
          <div className="flex gap-3 mb-6" onPaste={handlePinPaste}>
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={el => { pinRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handlePinChange(i, e.target.value)}
                onKeyDown={e => handlePinKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition-all"
              />
            ))}
          </div>

          {/* Resend */}
          <div className="flex items-center gap-2 text-[13px] mb-4">
            <span className="text-slate-500 dark:text-slate-400">Didn't get the PIN?</span>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isLoading}
              className="font-bold text-[#6342e9] hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend PIN"}
            </button>
          </div>

          <button
            onClick={() => { setStep("email"); setPin(["", "", "", "", "", ""]); setError(""); }}
            className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Use a different email
          </button>
        </div>
      </CardLayout>
    );
  }

  // Step 1: Email
  return (
    <CardLayout>
      <div className="w-full text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Forgot Password</h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-8">
          Enter your email address and we'll send you a PIN to reset your password.
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSendPin}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <Button type="submit" disabled={isLoading} className="bg-[#6342e9]">
            {isLoading ? "Sending..." : "Send Reset PIN"}
          </Button>

          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mt-2"
          >
            Back to Login
          </button>
        </form>
      </div>
    </CardLayout>
  );
};
