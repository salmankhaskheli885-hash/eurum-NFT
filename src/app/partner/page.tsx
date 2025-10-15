
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { DollarSign, Users, TrendingUp, ShieldCheck } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { listenToAllUsers, listenToUserTransactions } from "@/lib/firestore"
import type { User, Transaction } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"

export default function PartnerDashboardPage() {
  const { t } = useTranslation()
  const { user: currentUser, loading: userLoading } = useUser()
  const firestore = useFirestore()

  const [referredUsers, setReferredUsers] = React.useState<User[]>([])
  const [commissions, setCommissions] = React.useState<Transaction[]>([])
  const [networkInvestments, setNetworkInvestments] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!firestore || !currentUser) return;
    
    setLoading(true);

    const unsubscribeUsers = listenToAllUsers(firestore, (allUsers) => {
        const myReferrals = allUsers.filter(u => u.referredBy === currentUser.uid);
        setReferredUsers(myReferrals);
        
        if (myReferrals.length > 0) {
            const referredIds = myReferrals.map(u => u.uid);
            // In a real large-scale app, this would be done on a backend
            // to avoid hitting Firestore client-side query limits (max 10 'in' clauses).
            // For this app's scale, it's acceptable.
            const investmentPromises = referredIds.map(id => 
                new Promise<Transaction[]>((resolve) => {
                    listenToUserTransactions(firestore, id, txs => resolve(txs.filter(tx => tx.type === 'Investment')));
                })
            );
            // This is not optimal as it creates multiple listeners. A backend function would be better.
            // For now, we'll simplify this.
        }

        setLoading(false);
    });

    const unsubscribeCommissions = listenToUserTransactions(firestore, currentUser.uid, (transactions) => {
        setCommissions(transactions.filter(tx => tx.type === 'Commission'));
    });

    return () => {
        unsubscribeUsers();
        unsubscribeCommissions();
    };

  }, [firestore, currentUser])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact"
    }).format(amount)
  }
  
  const totalReferredUsers = referredUsers.length;
  const totalCommissionEarned = commissions.reduce((sum, tx) => sum + tx.amount, 0);
  const pendingKyc = referredUsers.filter(u => u.kycStatus === 'pending').length;
  // This is a simplified metric. A true 'total invested' would require more complex queries.
  const totalNetworkDeposits = referredUsers.reduce((sum, user) => sum + (user.totalDeposits || 0), 0);

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

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} isLoading={isLoading} />
        ))}
      </div>
    </div>
  )
}
