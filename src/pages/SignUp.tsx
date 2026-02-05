import React from "react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/AuthButton";
import { Checkbox } from "../components/ui/checkbox";
import { Divider } from "../components/ui/divider";

interface SignUpProps {
  onNavigate: (page: string) => void;
}

export const SignUp = ({ onNavigate }: SignUpProps) => {
  return (
    <AuthLayout>
      <AuthCard
        title="Create an Account"
        subtitle="Enter your details to create your account for free"
        footerLink={{
          text: "Got an account?",
          linkText: "Login",
          onClick: () => onNavigate("login"),
        }}
      >
        <div className="flex flex-col gap-6">
          <Button variant="google" onClick={() => console.log("Google Sign Up")}>
            Sign up with Google
          </Button>

          <Divider text="Or Continue with" />

          <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onNavigate("verification"); }}>
            <Input 
              label="Email*" 
              placeholder="Email" 
              type="email" 
              required 
            />
            
            <div className="flex flex-col gap-2">
              <Input 
                label="Password*" 
                placeholder="Create a strong password" 
                type="password"
                required 
              />
              <p className="text-[13px] text-slate-500">Must contain at least 8 characters</p>
            </div>

            <Input 
              label="Confirm Password*" 
              placeholder="Create a strong password" 
              type="password"
              required 
            />

            <Checkbox 
              label={
                <span>
                  I accept the <a href="#" className="text-[#4285f4] underline">Terms of Service</a> and <a href="#" className="text-[#4285f4] underline">Privacy Policy</a>.
                </span>
              }
              required
            />

            <Button type="submit">Sign up for free</Button>
          </form>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};
