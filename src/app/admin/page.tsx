
"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { DollarSign, Users, TrendingUp, ShieldCheck, Hourglass, Power } from "lucide-react"
import { useFirestore } from "@/firebase/provider"
import { listenToAllUsers, listenToAllTransactions, listenToAppSettings, updateAppSettings } from "@/lib/firestore"
import { type User, type Transaction, type AppSettings } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

function PanelControlCard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [settings, setSettings] = React.useState<Partial<AppSettings>>({});
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!firestore) return;
        const unsubscribe = listenToAppSettings(firestore, (appSettings) => {
            setSettings(appSettings);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleToggle = async (panel: 'isUserPanelEnabled' | 'isPartnerPanelEnabled' | 'isAgentPanelEnabled') => {
        if (!firestore) return;

        const newValue = !settings[panel];
        const newSettings = { ...settings, [panel]: newValue };
        setSettings(newSettings); // Optimistic update

        try {
            await updateAppSettings(firestore, { [panel]: newValue });
            toast({
                title: "Setting Updated",
                description: `${panel.replace('is', '').replace('Enabled', '')} has been ${newValue ? 'Enabled' : 'Disabled'}.`
            });
        } catch (error) {
            // Revert on failure
            setSettings(prev => ({ ...prev, [panel]: !newValue }));
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not save the setting."
            });
        }
    };
    
    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Power className="h-5 w-5 text-primary"/>Panel Control</CardTitle>
                    <CardDescription>Enable or disable access to different panels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Power className="h-5 w-5 text-primary"/>Panel Control</CardTitle>
                <CardDescription>Enable or disable access to different panels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="user-panel-switch" className="font-medium">User Panel</Label>
                    <Switch
                        id="user-panel-switch"
                        checked={settings.isUserPanelEnabled ?? true}
                        onCheckedChange={() => handleToggle('isUserPanelEnabled')}
                    />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="partner-panel-switch" className="font-medium">Partner Panel</Label>
                    <Switch
                        id="partner-panel-switch"
                        checked={settings.isPartnerPanelEnabled ?? true}
                        onCheckedChange={() => handleToggle('isPartnerPanelEnabled')}
                    />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="agent-panel-switch" className="font-medium">Agent Panel</Label>
                    <Switch
                        id="agent-panel-switch"
                        checked={settings.isAgentPanelEnabled ?? true}
                        onCheckedChange={() => handleToggle('isAgentPanelEnabled')}
                    />
                </div>
            </CardContent>
        </Card>
    );
}


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
        if (transactions.length > 0) setLoading(false); 
    });
    
    const unsubscribeTransactions = listenToAllTransactions(firestore, (allTransactions) => {
        setTransactions(allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
         if (users.length > 0 || allTransactions.length > 0) setLoading(false);
    });

    // Initial loading fallback
    const timer = setTimeout(() => setLoading(false), 3000);

    return () => {
        unsubscribeUsers();
        unsubscribeTransactions();
        clearTimeout(timer);
    };
  }, [firestore, users.length, transactions.length]);


  const totalUsers = users.length;
  const totalDeposits = transactions
      .filter(tx => tx.type === 'Deposit' && tx.status === 'Completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
  const pendingWithdrawals = transactions.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending').length;
  const pendingDeposits = transactions.filter(tx => tx.type === 'Deposit' && tx.status === 'Pending').length;
  const totalInvested = transactions
      .filter(tx => tx.type === 'Investment')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const pendingKyc = users.filter(user => user.kycStatus === 'pending').length;
  
   const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
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
  
  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Pending': return 'secondary'
      case 'Failed': return 'destructive'
      default: return 'outline'
    }
  }

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

  const recentTransactions = transactions.slice(0, 5);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>{t('admin.activityLogs')}</CardTitle>
                <CardDescription>{t('admin.activityLogsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : recentTransactions.length > 0 ? (
                        recentTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                            <TableCell>
                                <div className="font-medium">{tx.userName}</div>
                                <div className="text-sm text-muted-foreground hidden md:inline">{tx.userId.substring(0,10)}...</div>
                            </TableCell>
                            <TableCell>{tx.type}</TableCell>
                            <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(tx.amount)}
                            </TableCell>
                             <TableCell className="text-center">
                                <Badge variant={getStatusVariant(tx.status)}>
                                {tx.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                            {t('admin.activityPlaceholder')}
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
         <div className="flex flex-col gap-4">
             <Card>
                <CardHeader>
                    <CardTitle>{t('admin.manualActions')}</CardTitle>
                    <CardDescription>{t('admin.manualActionsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2">
                        <Link href="/admin/deposits">
                            <Button variant="outline" className="w-full justify-start">
                                Approve Deposits
                                {pendingDeposits > 0 && <Badge className="ml-auto">{pendingDeposits}</Badge>}
                            </Button>
                        </Link>
                        <Link href="/admin/withdrawals">
                            <Button variant="outline" className="w-full justify-start">
                                Approve Withdrawals
                                {pendingWithdrawals > 0 && <Badge className="ml-auto">{pendingWithdrawals}</Badge>}
                            </Button>
                        </Link>
                        <Link href="/admin/kyc">
                            <Button variant="outline" className="w-full justify-start">
                                Approve KYC
                                {pendingKyc > 0 && <Badge className="ml-auto">{pendingKyc}</Badge>}
                            </Button>
                        </Link>
                        <Link href="/admin/users">
                            <Button variant="outline" className="w-full justify-start">
                                Manage Users
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
            <PanelControlCard />
         </div>
      </div>
    </div>
  )
}

    