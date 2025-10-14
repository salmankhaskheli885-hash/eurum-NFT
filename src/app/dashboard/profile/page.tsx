"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { mockUser, mockTransactions } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
    const { t } = useTranslation()
    const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: mockUser.currency,
        }).format(amount)
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
                <Card className="md:col-span-1">
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

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
                        <CardDescription>A list of your recent transactions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>{t('dashboard.transactionId')}</TableHead>
                                <TableHead>{t('dashboard.transactionType')}</TableHead>
                                <TableHead>{t('dashboard.transactionDate')}</TableHead>
                                <TableHead className="text-right">{t('dashboard.transactionAmount')}</TableHead>
                                <TableHead className="text-center">{t('dashboard.transactionStatus')}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {mockTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                <TableCell className="font-medium">{transaction.id}</TableCell>
                                <TableCell>{transaction.type}</TableCell>
                                <TableCell>{transaction.date}</TableCell>
                                <TableCell className={`text-right ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(transaction.amount)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={transaction.status === 'Completed' ? 'default' : transaction.status === 'Pending' ? 'secondary' : 'destructive'}>
                                        {transaction.status}
                                    </Badge>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
