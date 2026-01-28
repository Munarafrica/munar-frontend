import React, { useState } from "react";
import { ProfileSetupLayout } from "../components/auth/CardLayout";
import { Button } from "../components/ui/AuthButton";
import { IndividualIcon, OrganizationIcon } from "../components/icons";

interface AccountTypeProps {
  onNavigate: (page: string) => void;
}

type AccountTypeOption = "individual" | "organization";

export const AccountType = ({ onNavigate }: AccountTypeProps) => {
  const [selectedType, setSelectedType] = useState<AccountTypeOption>("individual");

  return (
    <ProfileSetupLayout>
      <div className="w-full flex flex-col items-center">
        <div className="text-center mb-8">
          <h2 className="text-[21px] font-bold text-slate-900 mb-2">Choose an Account Type</h2>
          <p className="text-[13px] text-slate-500/70">Choose how you want to use the platform.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full mb-8 min-h-[365px]">
          {/* Individual Card */}
          <div 
            onClick={() => setSelectedType("individual")}
            className={`
              flex-1 relative rounded-[8px] p-6 cursor-pointer transition-all duration-200 flex flex-col justify-center
              ${selectedType === "individual" 
                ? "bg-[#e7ddff] ring-1 ring-[#8b5cf6]" 
                : "bg-white border border-slate-100 hover:border-[#8b5cf6]/50"}
            `}
          >
            <div className="flex flex-col gap-6">
              <div className={`p-2.5 rounded-[8px] w-fit ${selectedType === "individual" ? "bg-[#d7c6fe]" : "bg-slate-50 border border-slate-100"}`}>
                 <IndividualIcon className={selectedType === "individual" ? "text-[#8b5cf6]" : "text-slate-500"} />
              </div>
              <div className="flex flex-col gap-5">
                <h3 className="text-[18px] font-bold text-[#262626]">Individual Organiser</h3>
                <div className="text-[16px] text-[#737373] leading-normal space-y-1">
                  <p>Perfect for freelancers, creators, and solo event hosts managing personal brands.</p>
                  <p>Organisation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Card */}
          <div 
            onClick={() => setSelectedType("organization")}
            className={`
              flex-1 relative rounded-[8px] p-6 cursor-pointer transition-all duration-200 flex flex-col justify-center
              ${selectedType === "organization" 
                ? "bg-[#e7ddff] ring-1 ring-[#8b5cf6]" 
                : "bg-white border border-slate-100 hover:border-[#8b5cf6]/50"}
            `}
          >
             <div className="flex flex-col gap-6">
              <div className={`p-2.5 rounded-[8px] w-fit ${selectedType === "organization" ? "bg-[#d7c6fe]" : "bg-white border border-slate-100"}`}>
                 <OrganizationIcon className={selectedType === "organization" ? "text-[#8b5cf6]" : "text-[#525252]"} />
              </div>
              <div className="flex flex-col gap-5">
                <h3 className="text-[18px] font-bold text-[#262626]">Organisation/ Agency</h3>
                <p className="text-[16px] text-[#737373] leading-normal">
                  Best for agencies, companies, and teams needing multi-user access and advanced tools.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => onNavigate("profile-setup")}
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-4 rounded-[12px]"
        >
          Continue
        </Button>
      </div>
    </ProfileSetupLayout>
  );
};
