
"use client"

import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-[350px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground">
             Enter your details below to create your account
          </p>
        </div>
        <AuthForm view='register' />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary"
          >
            Already have an account? Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
