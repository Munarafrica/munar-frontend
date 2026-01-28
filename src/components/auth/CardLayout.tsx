import React from "react";
import { Logo } from "../ui/Logo";

interface CardLayoutProps {
  children: React.ReactNode;
}

export const CardLayout = ({ children }: CardLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] items-center justify-center p-4">
      <div className="bg-white rounded-[16px] p-8 md:p-10 w-full max-w-[500px] shadow-sm border border-slate-100 flex flex-col items-center">
        {children}
      </div>
    </div>
  );
};

export const ProfileSetupLayout = ({ children }: CardLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] items-center justify-center p-4">
        {/* Logo Header */}
      <div className="bg-white rounded-[16px] p-8 md:p-10 w-full max-w-[600px] shadow-sm border border-slate-100 flex flex-col items-center relative">
         <div className="mb-6 flex flex-col items-center">
             <Logo variant="dark" />
         </div>
        {children}
      </div>
    </div>
  );
};
