
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useTranslation } from "@/hooks/use-translation"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { PageTransitionLoader } from "@/components/page-transition-loader"

export default function ProfilePage() {
    const { t } = useTranslation()
    const { user, loading } = useUser();
    const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

    if (loading) {
        return <PageTransitionLoader />
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
