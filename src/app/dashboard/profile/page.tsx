
"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { mockUser } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"

export default function ProfilePage() {
    const { t } = useTranslation()
    const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

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
                        <AvatarFallback className="text-3xl">{mockUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('profile.name')}</Label>
                        <Input id="name" value={mockUser.name} readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('profile.email')}</Label>
                        <Input id="email" value={mockUser.email} readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="uid">{t('profile.uid')}</Label>
                        <Input id="uid" value={mockUser.shortUid} readOnly />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
