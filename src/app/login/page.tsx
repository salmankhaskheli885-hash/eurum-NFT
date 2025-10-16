
"use client"

import * as React from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link';

export default function LoginPage() {
  const [role, setRole] = React.useState<'user' | 'partner'>('user');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-[350px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign In To Your Account
          </h1>
          <p className="text-sm text-muted-foreground">
             Select your role and sign in with Google
          </p>
        </div>

        <Tabs defaultValue="user" onValueChange={(value) => setRole(value as 'user' | 'partner')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user">User</TabsTrigger>
                <TabsTrigger value="partner">Partner</TabsTrigger>
            </TabsList>
        </Tabs>
        
        <AuthForm intendedRole={role} />

        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{' '}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>
          .
        </p>

      </div>
    </div>
  );
}
