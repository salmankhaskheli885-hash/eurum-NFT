
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
                <CardDescription>{t("login.description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="user" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="user">{t("login.userTab")}</TabsTrigger>
                        <TabsTrigger value="partner">{t("login.partnerTab")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="user">
                        <div className="pt-4 space-y-4">
                          <AuthForm role="user" />
                        </div>
                         <div className="mt-4 text-center text-sm">
                            {t("login.noAccount")}{" "}
                            <Link href="/register" className="underline text-primary">
                            {t("login.signUpLink")}
                            </Link>
                        </div>
                    </TabsContent>
                    <TabsContent value="partner">
                       <div className="pt-4 space-y-4">
                           <AuthForm role="partner" />
                        </div>
                         <div className="mt-4 text-center text-sm">
                            {t("login.noAccountPartner")}{" "}
                            <Link href="/register" className="underline text-primary">
                            {t("login.signUpLink")}
                            </Link>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  );
}
