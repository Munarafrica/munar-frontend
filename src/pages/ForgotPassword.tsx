import React from "react";
import { CardLayout } from "../components/auth/CardLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/AuthButton";

interface ForgotPasswordProps {
  onNavigate: (page: string) => void;
}

export const ForgotPassword = ({ onNavigate }: ForgotPasswordProps) => {
  return (
    <CardLayout>
      <div className="w-full text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Forgot Password</h2>
        <p className="text-[13px] text-slate-500 mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onNavigate("reset-password"); }}>
          <Input 
            label="Email Address" 
            placeholder="Enter your email" 
            type="email"
            required
          />

          <Button type="submit" className="bg-[#6342e9]">
            Send Reset Link
          </Button>

          <button 
            type="button"
            onClick={() => onNavigate("login")}
            className="text-[13px] text-slate-500 hover:text-slate-900 mt-2"
          >
            Back to Login
          </button>
        </form>
      </div>
    </CardLayout>
  );
};
