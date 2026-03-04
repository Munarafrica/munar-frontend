import React, { useState } from "react";
import { ProfileSetupLayout } from "../components/auth/CardLayout";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/AuthButton";
import { useAuth } from "../contexts";

interface ProfileSetupProps {
  onNavigate: (page: string) => void;
}

export const ProfileSetup = ({ onNavigate }: ProfileSetupProps) => {
  const { user, updateProfile, isLoading } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [currency, setCurrency] = useState(user?.currency || "NGN");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and surname are required");
      return;
    }

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organization: organization.trim() || undefined,
        currency,
      });
      onNavigate("my-events");
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please try again.");
    }
  };

  return (
    <ProfileSetupLayout>
      <div className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Set up your profile</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">Tell us a bit more about yourself.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-6 w-full">
            <Input
              label="First Name*"
              placeholder="First Name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Surname*"
              placeholder="Surname"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Organization (Optional)"
            placeholder="Organization"
            value={organization}
            onChange={e => setOrganization(e.target.value)}
          />

          <Select
            label="Currency"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            options={[
              { label: "NGN (Nigerian Naira)", value: "NGN" },
              { label: "USD (US Dollar)", value: "USD" },
              { label: "EUR (Euro)", value: "EUR" },
              { label: "GBP (British Pound)", value: "GBP" },
              { label: "GHS (Ghanaian Cedi)", value: "GHS" },
              { label: "ZAR (South African Rand)", value: "ZAR" },
            ]}
          />

          <Button type="submit" disabled={isLoading} className="bg-[#6342e9] hover:bg-[#5232d9] mt-2">
            {isLoading ? "Saving..." : "Finish Setup"}
          </Button>
        </form>
      </div>
    </ProfileSetupLayout>
  );
};
