
"use client"

import * as React from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-[380px] flex-col justify-center space-y-6">
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user">{t('login.userTab')}/{t('login.partnerTab')}</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="agent">{t('login.agentTab')}</TabsTrigger>
          </TabsList>

          {/* User/Partner Tab */}
          <TabsContent value="user">
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
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin">
             <div className="flex flex-col space-y-2 text-center my-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Admin Login
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in with your Google Admin account.
              </p>
            </div>
            <AuthForm intendedRole="admin" />
          </TabsContent>

          {/* Agent Tab */}
          <TabsContent value="agent">
             <div className="flex flex-col space-y-2 text-center my-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Agent Login
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in with your Google Agent account.
              </p>
            </div>
            <AuthForm intendedRole="agent" />
          </TabsContent>
        </Tabs>

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
