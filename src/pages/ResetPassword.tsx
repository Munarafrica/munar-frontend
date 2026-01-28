import React from "react";
import { CardLayout } from "../components/auth/CardLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/AuthButton";

interface ResetPasswordProps {
  onNavigate: (page: string) => void;
}

export const ResetPassword = ({ onNavigate }: ResetPasswordProps) => {
  return (
    <CardLayout>
      <div className="w-full text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h2>
        <p className="text-[13px] text-slate-500 mb-8">
          Enter your new password below.
        </p>

        <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onNavigate("login"); }}>
          <div className="flex flex-col gap-1 text-left">
             <Input 
                label="New Password" 
                placeholder="Create a new password" 
                type="password"
                required
              />
              <p className="text-[11px] text-slate-400">Must be at least 8 characters</p>
          </div>

          <Input 
            label="Confirm Password" 
            placeholder="Confirm new password" 
            type="password"
            required
          />

          <Button type="submit" className="bg-[#6342e9]">
            Reset Password
          </Button>
        </form>
      </div>
    </CardLayout>
  );
};
