
"use client"

import { AuthForm } from '@/components/auth/auth-form';
import { AgentAuthForm } from '@/components/auth/agent-auth-form';
import { useTranslation } from '@/hooks/use-translation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-[350px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('login.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
             {t('login.description')}
          </p>
        </div>
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user">{t('login.userTab')}</TabsTrigger>
            <TabsTrigger value="partner">{t('login.partnerTab')}</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
          </TabsList>
          <TabsContent value="user">
            <AuthForm mode="login" role="user" />
          </TabsContent>
          <TabsContent value="partner">
            <AuthForm mode="login" role="partner" />
          </TabsContent>
           <TabsContent value="agent">
            <AgentAuthForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
