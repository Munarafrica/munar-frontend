import React from "react";
import { CardLayout } from "../components/auth/CardLayout";
import { MailIcon } from "../components/icons";

interface EmailVerificationProps {
  onNavigate: (page: string) => void;
  email?: string;
}

export const EmailVerification = ({ onNavigate, email = "student@university.edu" }: EmailVerificationProps) => {
  return (
    <CardLayout>
      <div className="flex flex-col items-center text-center max-w-[400px]">
        {/* Icon */}
        <div className="mb-6">
          <div className="p-1 rounded-[14px] border border-slate-100 bg-white">
            <div className="bg-[#8b5cf6] p-3 rounded-[10px] shadow-[0px_4px_4px_rgba(89,89,89,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 shadow-[inset_2px_4px_4px_rgba(255,255,255,0.25)] rounded-[10px] pointer-events-none" />
                <MailIcon className="text-white size-7" />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">Check your Inbox</h1>
        
        <div className="text-sm text-slate-500 mb-8 leading-relaxed">
          <p>We've sent a verification link to</p>
          <p className="font-bold text-slate-700 mb-2">{email}.</p>
          <p>Please click the link in that email to secure your account</p>
        </div>

        <div className="flex flex-col gap-4 text-[13px] w-full items-center">
            <div className="flex items-center gap-2">
                <span className="text-slate-900">Didnt see the Email:</span>
                <button className="font-bold text-[#6342e9] hover:underline">Resend Verification Email</button>
            </div>
            
            <button 
                onClick={() => onNavigate("login")}
                className="text-slate-900 hover:text-slate-700"
            >
                Back to login
            </button>
        </div>
      </div>
    </CardLayout>
  );
};
