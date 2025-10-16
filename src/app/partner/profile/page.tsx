
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useTranslation } from "@/hooks/use-translation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { listenToUserTransactions } from "@/lib/firestore"
import type { Transaction } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
    const { t } = useTranslation()
    const firestore = useFirestore()
    const { user, loading: userLoading } = useUser()
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [transactionsLoading, setTransactionsLoading] = React.useState(true)
    
    const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

    React.useEffect(() => {
        if (!firestore || !user?.uid) return;
        setTransactionsLoading(true);
        const unsubscribe = listenToUserTransactions(firestore, user.uid, (newTransactions) => {
            setTransactions(newTransactions);
            setTransactionsLoading(false);
        }, 5); // Fetch latest 5
        return () => unsubscribe();
    }, [firestore, user?.uid]);


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: user?.currency || "PKR",
        }).format(amount)
    }
    
    const getStatusVariant = (status: Transaction['status']) => {
        switch (status) {
        case 'Completed': return 'default'
        case 'Pending': return 'secondary'
        case 'Failed': return 'destructive'
        default: return 'outline'
        }
    }
    
    const loading = userLoading || transactionsLoading;

     if (loading) {
        return (
             <div className="flex flex-col gap-8 max-w-4xl mx-auto">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <Card className="md:col-span-1">
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
                    <Card className="md:col-span-2">
                        <CardHeader>
                             <Skeleton className="h-7 w-48" />
                             <Skeleton className="h-4 w-64 mt-2" />
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div className="flex justify-between items-center" key={i}>
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!user) {
        return <div>Please log in to see your profile.</div>
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

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('profile.recentTransactions')}</CardTitle>
                        <CardDescription>A list of your recent transactions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>{t('profile.transactionId')}</TableHead>
                                <TableHead>{t('profile.transactionType')}</TableHead>
                                <TableHead>{t('profile.transactionDate')}</TableHead>
                                <TableHead className="text-right">{t('profile.transactionAmount')}</TableHead>
                                <TableHead className="text-center">{t('profile.transactionStatus')}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {transactions.length > 0 ? (
                                    transactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                        <TableCell className="font-medium">{transaction.id.substring(0, 8)}...</TableCell>
                                        <TableCell>{transaction.type}</TableCell>
                                        <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                                        <TableCell className={`text-right ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(transaction.amount)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getStatusVariant(transaction.status)}>
                                                {transaction.status}
                                            </Badge>
                                        </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No recent transactions.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
