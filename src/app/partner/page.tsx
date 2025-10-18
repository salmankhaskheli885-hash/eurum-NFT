
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { DollarSign, Users, TrendingUp, ShieldCheck, Megaphone } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { listenToAllUsers, listenToUserTransactions, listenToLatestAnnouncement } from "@/lib/firestore"
import type { User, Transaction, Announcement as AnnouncementType } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"


function Announcement() {
    const firestore = useFirestore();
    const [announcement, setAnnouncement] = React.useState<AnnouncementType | null>(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
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

export default function PartnerDashboardPage() {
  const { t } = useTranslation()
  const { user: currentUser, loading: userLoading } = useUser()
  const firestore = useFirestore()

  const [referredUsers, setReferredUsers] = React.useState<User[]>([])
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!firestore || !currentUser) return;
    
    setLoading(true);

    const unsubscribeUsers = listenToAllUsers(firestore, (allUsers) => {
        const myReferrals = allUsers.filter(u => u.referredBy === currentUser.uid);
        setReferredUsers(myReferrals);
        setLoading(false); // Set loading false after users are fetched
    });

    const unsubscribeTransactions = listenToUserTransactions(firestore, currentUser.uid, (transactions) => {
        setTransactions(transactions);
    });

    return () => {
        unsubscribeUsers();
        unsubscribeTransactions();
    };

  }, [firestore, currentUser])

  const formatCurrency = (amount: number, compact = true) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
      notation: compact ? "compact" : "standard"
    }).format(amount)
  }
   const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
  }
  
  const totalReferredUsers = referredUsers.length;
  const totalCommissionEarned = transactions
    .filter(tx => tx.type === 'Commission')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingKyc = referredUsers.filter(u => u.kycStatus === 'pending').length;
  // This is a simplified metric. A true 'total invested' would require more complex queries.
  const totalNetworkDeposits = referredUsers.reduce((sum, user) => sum + (user.totalDeposits || 0), 0);
  
  const investmentTransactions = transactions.filter(
      tx => tx.type === 'Investment' || tx.type === 'Payout' || tx.type === 'Commission'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const isLoading = userLoading || loading;

  const stats = [
    { title: t('partner.dashboard.totalUsers'), value: totalReferredUsers.toString(), icon: Users },
    { title: t('partner.dashboard.totalInvested'), value: formatCurrency(totalNetworkDeposits), icon: DollarSign },
    { title: t('partner.dashboard.totalCommission'), value: formatCurrency(totalCommissionEarned), icon: TrendingUp },
    { title: t('partner.dashboard.pendingKyc'), value: pendingKyc.toString(), icon: ShieldCheck },
  ]
  
  const StatCard = ({ stat, isLoading }: { stat: typeof stats[0], isLoading: boolean }) => (
     <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-bold">{stat.value}</div>}
        </CardContent>
    </Card>
  )


  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('partner.dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('partner.dashboard.description')}</p>
      </div>
      <Announcement />
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} isLoading={isLoading} />
        ))}
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Investment & Commission History</CardTitle>
            <CardDescription>A list of your investments, payouts, and commission earnings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Details</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
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
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(transaction.amount, false)}
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
                        <TableCell colSpan={5} className="h-24 text-center">No investment or commission transactions found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  )
}
