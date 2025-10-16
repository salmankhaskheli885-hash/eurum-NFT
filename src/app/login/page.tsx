
"use client"

import * as React from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function LoginPage() {

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-[350px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">
             Sign in with Google to access your account
          </p>
        </div>
        
        <AuthForm />

        <p className="px-8 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}
