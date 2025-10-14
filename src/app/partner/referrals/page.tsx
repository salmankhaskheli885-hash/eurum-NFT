
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { DollarSign, Users, TrendingUp } from "lucide-react"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/hooks/use-user"
import type { User } from "@/lib/data"
import { listenToAllUsers } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReferralsPage() {
  const { t } = useTranslation()
  const firestore = useFirestore()
  const { user: currentUser, loading: userLoading } = useUser()
  
  const [referredUsers, setReferredUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!firestore || !currentUser) return;
    setLoading(true);
    // In a real app, you'd query for users where `referredBy === currentUser.uid`
    // For this demo, we'll just show all users except the current one as "referred"
    const unsubscribe = listenToAllUsers(firestore, (allUsers) => {
        setReferredUsers(allUsers.filter(u => u.uid !== currentUser.uid));
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, currentUser]);

  const totalReferredUsers = referredUsers.length;
  const totalDeposits = referredUsers.reduce((acc, user) => acc + (user.balance > 0 ? user.balance : 0), 0); // Simplified logic

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }
  
  const isLoading = userLoading || loading;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('referrals.title')}</h1>
        <p className="text-muted-foreground">{t('referrals.description')}</p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('referrals.totalReferredUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalReferredUsers}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('referrals.totalDeposits')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(totalDeposits)}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('partner.referrals.commissionRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10%</div>
             <p className="text-xs text-muted-foreground">{t('referrals.commissionNotice')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('referrals.referredUsersList')}</CardTitle>
          <CardDescription>{t('referrals.referredUsersListDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('referrals.table.name')}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">{t('referrals.table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                    </TableRow>
                ))
              ) : referredUsers.length > 0 ? (
                referredUsers.map((user) => (
                    <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                            {user.status}
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">No referred users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
