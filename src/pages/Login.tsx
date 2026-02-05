import React from "react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/AuthButton";
import { Divider } from "../components/ui/divider";

interface LoginProps {
  onNavigate: (page: string) => void;
}

export const Login = ({ onNavigate }: LoginProps) => {
  return (
    <AuthLayout>
      <AuthCard
        title="Welcome Back"
        subtitle="Log into your account"
        footerLink={{
          text: "Don't have an account?",
          linkText: "Sign Up",
          onClick: () => onNavigate("signup"),
        }}
      >
        <div className="flex flex-col gap-6">
          <Button variant="google" onClick={() => console.log("Google Login")}>
            Sign up with Google
          </Button>

          <Divider text="Or Continue with" />

          <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onNavigate("account-type"); }}>
            <Input 
              label="Email*" 
              placeholder="Email" 
              type="email"
              required 
            />
            
            <div className="flex flex-col gap-1">
              <Input 
                label="Password*" 
                placeholder="Enter your password" 
                type="password"
                required 
              />
              <div className="flex justify-end">
                <button 
                    type="button"
                    onClick={() => onNavigate("forgot-password")}
                    className="text-[13px] text-[#8b5cf6] font-medium hover:underline"
                >
                    Forgot Password?
                </button>
              </div>
            </div>

            <Button type="submit">Login</Button>
          </form>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};
