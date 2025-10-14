"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { Logo } from "@/components/icons";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0_0_48_48" width="1em" height="1em" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.698,44,30.342,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

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
            <Tabs defaultValue="user" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="user">{t("register.userTab")}</TabsTrigger>
                    <TabsTrigger value="partner">{t("register.partnerTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="user">
                    <div className="grid gap-4 pt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full-name">{t('register.nameLabel')}</Label>
                            <Input id="full-name" placeholder="Satoshi Nakamoto" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('register.emailLabel')}</Label>
                            <Input id="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('register.passwordLabel')}</Label>
                            <Input id="password" type="password" required/>
                        </div>
                        <Button type="submit" className="w-full">
                            <Link href="/dashboard" className="w-full h-full flex items-center justify-center">{t('register.button')}</Link>
                        </Button>
                    </div>
                     <div className="mt-4 text-center text-sm">
                        {t('register.hasAccount')}{" "}
                        <Link href="/login" className="underline text-primary">
                        {t('register.signInLink')}
                        </Link>
                    </div>
                </TabsContent>
                <TabsContent value="partner">
                    <div className="grid gap-4 pt-4">
                         <div className="grid gap-2">
                            <Label htmlFor="partner-full-name">{t('register.nameLabel')}</Label>
                            <Input id="partner-full-name" placeholder="Vitalik Buterin" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="partner-email">{t('register.emailLabel')}</Label>
                            <Input id="partner-email" type="email" placeholder="partner@example.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="partner-password">{t('register.passwordLabel')}</Label>
                            <Input id="partner-password" type="password" required/>
                        </div>
                        <Button type="submit" className="w-full">
                            <Link href="/admin" className="w-full h-full flex items-center justify-center">{t('register.buttonPartner')}</Link>
                        </Button>
                    </div>
                     <div className="mt-4 text-center text-sm">
                        {t('register.hasAccountPartner')}{" "}
                        <Link href="/login" className="underline text-primary">
                        {t('register.signInLink')}
                        </Link>
                    </div>
                </TabsContent>
            </Tabs>
             <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    {t('register.separator')}
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full mt-6">
                <GoogleIcon className="mr-2 h-4 w-4"/>
                {t('register.googleButton')}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
