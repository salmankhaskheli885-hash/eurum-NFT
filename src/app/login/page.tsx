
"use client"

import * as React from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-[380px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center my-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('login.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('login.description')}
          </p>
        </div>
        <AuthForm intendedRole="user" />
        <p className="mt-6 px-8 text-center text-sm text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-primary"
          >
            {t('login.signUpLink')}
          </Link>
        </p>

        <p className="px-8 text-center text-sm text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link
            href="/dashboard/settings"
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
