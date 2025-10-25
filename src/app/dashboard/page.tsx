
"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
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
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Megaphone } from "lucide-react"
import { useFirestore } from "@/firebase/provider"
import { listenToLatestAnnouncement, listenToUserTransactions } from "@/lib/firestore"
import { cn } from "@/lib/utils"
import { PageTransitionLoader } from "@/components/page-transition-loader"
import { InstallAppButton } from "@/components/install-app-button"

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
    if (!firestore || !user?.uid) {
        if (!userLoading) setTransactionsLoading(false);
        return;
    };
    setTransactionsLoading(true);
    const unsubscribe = listenToUserTransactions(firestore, user.uid, (newTransactions) => {
        setTransactions(newTransactions);
        setTransactionsLoading(false);
    }); // Fetch all transactions
    return () => unsubscribe();
  }, [firestore, user?.uid, userLoading]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
    }).format(amount)
  }
  
  const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
  }
  
  const investmentTransactions = transactions.filter(
      tx => tx.type === 'Investment' || tx.type === 'Payout'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isLoading = userLoading || transactionsLoading;
  
  if (isLoading) {
      return <PageTransitionLoader />
  }

  if (!user) {
    return <div>Please log in to see your dashboard.</div>
  }

  const userFirstName = user.displayName?.split(" ")[0] || ''

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
       {viewAsUserId && (
        <Alert variant="destructive">
          <AlertTitle>Admin View</AlertTitle>
          <AlertDescription>
            You are viewing the dashboard as **{user.displayName}** (UID: {user.uid}). <Link href="/admin/users" className="underline font-bold">Return to Admin Panel.</Link>
          </AlertDescription>
        </Alert>
      )}
      <Announcement />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-start justify-between">
            <div>
              <CardTitle>{t('dashboard.welcome', { name: userFirstName })}</CardTitle>
              <CardDescription className="max-w-lg text-balance leading-relaxed pt-2">
                {t('dashboard.welcomeSubtitle')}
              </CardDescription>
            </div>
            <InstallAppButton />
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
              {/* This is a placeholder value */}
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
                {investmentTransactions.length > 0 ? (
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
                            <Badge
                              variant={transaction.status === 'Failed' ? 'destructive' : transaction.status === 'Completed' ? 'default' : 'secondary'}
                              className={cn(
                                transaction.status === 'Completed' && 'bg-green-600 hover:bg-green-700'
                              )}
                            >
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
      <DashboardContent />
  )
}
