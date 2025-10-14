
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { Logo } from "@/components/icons";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
    const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <Link href="/" className="inline-block mx-auto mb-4">
                <Logo className="w-16 h-16 text-primary" />
            </Link>
          <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
          <CardDescription>{t('register.description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="pt-4 space-y-4">
              <AuthForm role="user" isRegister={true} />
            </div>
             <div className="mt-4 text-center text-sm">
                {t('register.hasAccount')}{" "}
                <Link href="/login" className="underline text-primary">
                {t('register.signInLink')}
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
