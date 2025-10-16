
"use client"

import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-[350px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign In To Your Account
          </h1>
          <p className="text-sm text-muted-foreground">
             Enter your phone number to receive a login code
          </p>
        </div>
        <AuthForm view='login' />
      </div>
    </div>
  );
}

    