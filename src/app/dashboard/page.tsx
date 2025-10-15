
"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type Transaction, type Announcement as AnnouncementType } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Megaphone } from "lucide-react"
import { useFirestore } from "@/firebase/provider"
import { listenToLatestAnnouncement, listenToUserTransactions } from "@/lib/firestore"

function Announcement() {
    const firestore = useFirestore();
    const [announcement, setAnnouncement] = useState<AnnouncementType | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const unsubscribe = listenToLatestAnnouncement(firestore, (newAnnouncement) => {
            setAnnouncement(newAnnouncement);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    if (loading || !announcement) {
        return null;
    }

    return (
        <Alert>
            <Megaphone className="h-4 w-4" />
            <AlertTitle>Announcement!</AlertTitle>
            <AlertDescription>
                {announcement.message}
            </AlertDescription>
        </Alert>
    )
}

function DashboardContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const firestore = useFirestore()
  const viewAsUserId = searchParams.get('userId'); 

  const { user, loading: userLoading } = useUser({ viewAsUserId });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user?.uid) return;
    setTransactionsLoading(true);
    const unsubscribe = listenToUserTransactions(firestore, user.uid, (newTransactions) => {
        setTransactions(newTransactions);
        setTransactionsLoading(false);
    }); // Fetch all transactions
    return () => unsubscribe();
  }, [firestore, user?.uid]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
    }).format(amount)
  }
  
  const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString();
  }

  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Pending': return 'secondary'
      case 'Failed': return 'destructive'
      default: return 'outline'
    }
  }
  
  const investmentTransactions = transactions.filter(
      tx => tx.type === 'Investment' || tx.type === 'Payout'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  if (userLoading) {
      return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <Card className="sm:col-span-2">
                    <CardHeader className="pb-3">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-36" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('dashboard.balance')}</CardDescription>
                         <Skeleton className="h-10 w-3/4" />
                    </CardHeader>
                    <CardContent>
                       <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('dashboard.vipLevel')}</CardDescription>
                        <Skeleton className="h-10 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-3 w-1/2 mt-2" />
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Investment History</CardTitle>
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
      )
  }

  if (!user) {
    return <div>Please log in to see your dashboard.</div>
  }

  const userFirstName = user.displayName?.split(" ")[0]

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
       {viewAsUserId && (
        <Alert variant="destructive">
          <AlertTitle>Admin View</AlertTitle>
          <AlertDescription>
            You are viewing the dashboard as **{user.displayName}** (UID: {user.uid}). <a href="/admin/users" className="underline font-bold">Return to Admin Panel.</a>
          </AlertDescription>
        </Alert>
      )}
      <Announcement />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t('dashboard.welcome', { name: userFirstName })}</CardTitle>
            <CardDescription className="max-w-lg text-balance leading-relaxed">
              {t('dashboard.welcomeSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/investments">{t('dashboard.viewInvestments')}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.balance')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {formatCurrency(user.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +25% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.vipLevel')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {t('dashboard.vipLevelValue', { level: user.vipLevel })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={user.vipProgress} aria-label={`${user.vipProgress}% to next level`} />
            <div className="text-xs text-muted-foreground mt-2">
              {user.vipProgress}% {t('dashboard.vipProgress')}
            </div>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Investment History</CardTitle>
            <CardDescription>A list of your investment and payout transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Maturity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {transactionsLoading ? (
                    [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                            <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : investmentTransactions.length > 0 ? (
                    investmentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                            {transaction.investmentDetails?.planName || transaction.details || "N/A"}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{formatDate(transaction.investmentDetails?.maturityDate)}</TableCell>
                        <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant={getStatusVariant(transaction.status)}>
                                {transaction.status}
                            </Badge>
                        </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">No investment transactions found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
