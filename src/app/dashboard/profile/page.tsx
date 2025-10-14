
"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useTranslation } from "@/hooks/use-translation"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
    const { t } = useTranslation()
    const { user, loading } = useUser();
    const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

    if (loading) {
        return (
             <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
                </div>
                <Card>
                    <CardHeader className="items-center">
                        <Skeleton className="h-24 w-24 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!user) {
        return <div>Please log in to see your profile.</div>
    }

    return (
        <div className="flex flex-col gap-8 max-w-2xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
            </div>
            <Card>
                <CardHeader className="items-center">
                    <Avatar className="h-24 w-24">
                        {userAvatar && (
                        <AvatarImage
                            src={userAvatar.imageUrl}
                            alt={userAvatar.description}
                            width={96}
                            height={96}
                            data-ai-hint={userAvatar.imageHint}
                        />
                        )}
                        <AvatarFallback className="text-3xl">{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('profile.name')}</Label>
                        <Input id="name" value={user.displayName || ''} readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('profile.email')}</Label>
                        <Input id="email" value={user.email || ''} readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="uid">{t('profile.uid')}</Label>
                        <Input id="uid" value={user.shortUid} readOnly />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
