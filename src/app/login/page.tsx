
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

export default function LoginPage() {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="text-center">
                <Link href="/" className="inline-block mx-auto mb-4">
                    <Logo className="w-16 h-16 text-primary" />
                </Link>
                <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
                <CardDescription>
                  Start your journey with Fynix Pro today
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="pt-4 space-y-4">
                  <AuthForm />
                </div>
                 <div className="mt-4 text-center text-sm">
                    Don't have an account?{" "}
                    <Link href="/register" className="underline text-primary">
                    Sign Up
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
