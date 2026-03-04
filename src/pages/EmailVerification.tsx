import React, { useState, useRef, useEffect } from "react";
import { CardLayout } from "../components/auth/CardLayout";
import { MailIcon } from "../components/icons";
import { useAuth } from "../contexts";

interface EmailVerificationProps {
  onNavigate: (page: string) => void;
  email?: string;
}

export const EmailVerification = ({ onNavigate }: EmailVerificationProps) => {
  const { user, isAuthenticated, verifyEmail, resendVerification, refreshUser } = useAuth();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userEmail = user?.email || sessionStorage.getItem("munar_verify_email") || "your email";

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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
      handleVerify(newPin.join(""));
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
      setPin(pasted.split(""));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (pinCode: string) => {
    setIsLoading(true);
    setError("");
    try {
      await verifyEmail(userEmail, pinCode);
      setSuccess(true);
      // Refresh the user data so isEmailVerified is updated
      await refreshUser();
      // Navigate to account type selection or dashboard
      setTimeout(() => {
        if (user && (!user.firstName || !user.lastName)) {
          onNavigate("account-type");
        } else {
          onNavigate("my-events");
        }
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Invalid PIN. Please try again.");
      setPin(["", "", "", "", "", ""]);
      pinRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await resendVerification(userEmail);
      setResendCooldown(60);
      setPin(["", "", "", "", "", ""]);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Failed to resend PIN");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <CardLayout>
        <div className="flex flex-col items-center text-center max-w-[400px]">
          <div className="mb-6">
            <div className="p-1 rounded-[14px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="bg-emerald-500 p-3 rounded-[10px] shadow-[0px_4px_4px_rgba(89,89,89,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 shadow-[inset_2px_4px_4px_rgba(255,255,255,0.25)] rounded-[10px] pointer-events-none" />
                <svg className="text-white size-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Email Verified!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Your email has been verified successfully. Redirecting you...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      </CardLayout>
    );
  }

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

        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Verify your Email</h1>

        <div className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          <p>We've sent a 6-digit PIN to</p>
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">{userEmail}</p>
          <p>Enter the PIN below to verify your account.</p>
        </div>

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
              disabled={isLoading}
              className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition-all disabled:opacity-50"
            />
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Verifying...</span>
          </div>
        )}

        {/* Resend */}
        <div className="flex flex-col gap-4 text-[13px] w-full items-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-slate-100">Didn't get the PIN?</span>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isLoading}
              className="font-bold text-[#6342e9] hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend PIN"}
            </button>
          </div>

          <button
            onClick={() => onNavigate("login")}
            className="text-slate-900 dark:text-slate-100 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Back to login
          </button>
        </div>
      </div>
    </CardLayout>
  );
};
