import React from "react";
import { ProfileSetupLayout } from "../components/auth/CardLayout";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/AuthButton";

interface ProfileSetupProps {
  onNavigate: (page: string) => void;
}

export const ProfileSetup = ({ onNavigate }: ProfileSetupProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard after setup
    onNavigate('my-events');
  };

  return (
    <ProfileSetupLayout>
      <div className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Set up your profile</h2>
          <p className="text-[13px] text-slate-500">Tell us a bit more about yourself.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-6 w-full">
             <Input label="First Name*" placeholder="First Name" required />
             <Input label="Surname*" placeholder="Surname" required />
          </div>

          <Input label="Organization (Optional)" placeholder="Organization" />

          <Select 
            label="Currency" 
            options={[
              { label: "NGN (Nigerian Naira)", value: "NGN" },
              { label: "USD (US Dollar)", value: "USD" },
              { label: "EUR (Euro)", value: "EUR" },
              { label: "GBP (British Pound)", value: "GBP" },
            ]} 
          />

          <Button type="submit" className="bg-[#6342e9] hover:bg-[#5232d9] mt-2">
            Finish Setup
          </Button>
        </form>
      </div>
    </ProfileSetupLayout>
  );
};