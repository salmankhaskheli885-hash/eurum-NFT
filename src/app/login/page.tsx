
"use client"

import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
       <div className="w-full max-w-md">
         <div className="flex flex-col items-center text-center mb-8">
            <Logo className="w-16 h-16 text-primary mb-4" />
            <h1 className="text-3xl font-bold tracking-tight">Welcome to Fynix Pro</h1>
            <p className="text-muted-foreground mt-2">Sign in to continue to your account.</p>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
