
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
import { DollarSign, Users, TrendingUp, Copy } from "lucide-react"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/hooks/use-user"
import type { User, Transaction } from "@/lib/data"
import { listenToAllUsers, listenToUserTransactions } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function ReferralsPage() {
  const { t } = useTranslation()
  const firestore = useFirestore()
  const { user: currentUser, loading: userLoading } = useUser()
  const { toast } = useToast()
  
  const [referredUsers, setReferredUsers] = React.useState<User[]>([])
  const [commissions, setCommissions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!firestore || !currentUser) return;
    setLoading(true);

    const unsubscribeUsers = listenToAllUsers(firestore, (allUsers) => {
        setReferredUsers(allUsers.filter(u => u.referredBy === currentUser.uid));
        setLoading(false);
    });

    const unsubscribeCommissions = listenToUserTransactions(firestore, currentUser.uid, (transactions) => {
        setCommissions(transactions.filter(tx => tx.type === 'Commission'));
    });

    return () => {
        unsubscribeUsers();
        unsubscribeCommissions();
    };
  }, [firestore, currentUser]);

  const totalReferredUsers = referredUsers.length;
  const totalCommissionEarned = commissions.reduce((acc, tx) => acc + tx.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
    }).format(amount)
  }
  
  const handleCopyLink = () => {
    if (!currentUser?.referralLink) return;
    navigator.clipboard.writeText(currentUser.referralLink);
    toast({
        title: "Link Copied!",
        description: "Your referral link has been copied to the clipboard.",
    })
  }

  const isLoading = userLoading || loading;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('referrals.title')}</h1>
        <p className="text-muted-foreground">{t('referrals.description')}</p>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>{t('referrals.yourLink')}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex space-x-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                ): (
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                                Link
                            </Label>
                            <Input
                                id="link"
                                defaultValue={currentUser?.referralLink}
                                readOnly
                            />
                        </div>
                        <Button type="submit" size="icon" className="shrink-0" onClick={handleCopyLink}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
       </Card>

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
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(totalCommissionEarned)}</div>}
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

    