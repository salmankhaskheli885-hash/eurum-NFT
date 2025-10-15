
"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { DollarSign, Users, TrendingUp, ShieldCheck, Hourglass } from "lucide-react"
import { useFirestore } from "@/firebase/provider"
import { listenToAllUsers, listenToAllTransactions } from "@/lib/firestore"
import { type User, type Transaction } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const firestore = useFirestore()
  
  const [users, setUsers] = React.useState<User[]>([])
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!firestore) return;
    
    setLoading(true);

    const unsubscribeUsers = listenToAllUsers(firestore, (allUsers) => {
        setUsers(allUsers);
        // We can set loading to false once one of the listeners returns data
        setLoading(false); 
    });
    
    const unsubscribeTransactions = listenToAllTransactions(firestore, (allTransactions) => {
        setTransactions(allTransactions);
    });

    return () => {
        unsubscribeUsers();
        unsubscribeTransactions();
    };
  }, [firestore]);


  const totalUsers = users.length;
  const totalDeposits = transactions
      .filter(tx => tx.type === 'Deposit' && tx.status === 'Completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
  const pendingWithdrawals = transactions.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending').length;
  const totalInvested = transactions
      .filter(tx => tx.type === 'Investment')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const pendingKyc = users.filter(user => user.kycStatus === 'pending').length;
  
   const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact"
    }).format(amount)
  }

  const stats = [
    { title: t('admin.stats.totalUsers'), value: totalUsers.toString(), icon: Users },
    { title: t('admin.stats.totalDeposits'), value: formatCurrency(totalDeposits), icon: DollarSign },
    { title: t('admin.stats.pendingWithdrawals'), value: pendingWithdrawals.toString(), icon: Hourglass },
    { title: t('admin.stats.totalInvested'), value: formatCurrency(totalInvested), icon: TrendingUp },
    { title: t('admin.stats.pendingKyc'), value: pendingKyc.toString(), icon: ShieldCheck },
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
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboardTitle')}</h1>
        <p className="text-muted-foreground">{t('admin.dashboardDescription')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} isLoading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>{t('admin.manualActions')}</CardTitle>
                <CardDescription>{t('admin.manualActionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>{t('admin.action.approveWithdrawals')}</li>
                    <li>{t('admin.action.manageUsers')}</li>
                    <li>{t('admin.action.approveKyc')}</li>
                    <li>{t('admin.action.managePlans')}</li>
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>{t('admin.activityLogs')}</CardTitle>
                <CardDescription>{t('admin.activityLogsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">{t('admin.activityPlaceholder')}</p>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
