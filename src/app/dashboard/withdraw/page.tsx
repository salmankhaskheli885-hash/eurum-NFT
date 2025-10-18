
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslation } from "@/hooks/use-translation"
import { Landmark } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addTransaction, listenToAppSettings, listenToUserTransactions } from "@/lib/firestore"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppSettings, Transaction } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

function WithdrawalHistory() {
    const { user, loading: userLoading } = useUser()
    const firestore = useFirestore()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || !firestore) return;
        setLoading(true);
        const unsubscribe = listenToUserTransactions(firestore, user.uid, (allTransactions) => {
            const withdrawalTxs = allTransactions
                .filter(tx => tx.type === 'Withdrawal')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(withdrawalTxs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, firestore]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
    const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(amount);
    const getStatusVariant = (status: Transaction['status']) => {
        switch (status) {
            case 'Completed': return 'default'
            case 'Pending': return 'secondary'
            case 'Failed': return 'destructive'
            default: return 'outline'
        }
    }
    
    const isLoading = userLoading || loading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
                <CardDescription>A list of your past withdrawals.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{formatDate(tx.date)}</TableCell>
                                     <TableCell>
                                        <div className="font-medium">{tx.withdrawalDetails?.accountName}</div>
                                        <div className="text-xs text-muted-foreground">{tx.withdrawalDetails?.method} - {tx.withdrawalDetails?.accountNumber}</div>
                                     </TableCell>
                                    <TableCell className="text-right font-medium text-red-600">{formatCurrency(tx.amount)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No withdrawals found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export default function WithdrawPage() {
    const { t } = useTranslation()
    const { user, loading: userLoading } = useUser()
    const router = useRouter()
    const { toast } = useToast()
    const firestore = useFirestore()
    
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);

    const [method, setMethod] = useState("jazzcash")
    const [accountNumber, setAccountNumber] = useState("")
    const [accountName, setAccountName] = useState("")
    const [amount, setAmount] = useState("")

     useEffect(() => {
        if (!firestore) return;
        setSettingsLoading(true);
        const unsubscribe = listenToAppSettings(firestore, (newSettings) => {
            setSettings(newSettings);
            setSettingsLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
         if (!user || !firestore || !settings) {
            toast({
                variant: "destructive",
                title: "Not Logged In or system not ready",
                description: "You must be logged in to make a withdrawal.",
            })
            return
        }

        const withdrawalAmount = parseFloat(amount);
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            toast({ variant: "destructive", title: "Invalid Amount" });
            return;
        }

        if (settings.minWithdrawal && withdrawalAmount < settings.minWithdrawal) {
            toast({ variant: 'destructive', title: `Minimum withdrawal is PKR ${settings.minWithdrawal}` });
            return;
        }
        if (settings.maxWithdrawal && withdrawalAmount > settings.maxWithdrawal) {
            toast({ variant: 'destructive', title: `Maximum withdrawal is PKR ${settings.maxWithdrawal}` });
            return;
        }
        
        try {
            await addTransaction(firestore, {
                userId: user.uid,
                userName: user.displayName || 'Unknown User',
                userRole: user.role,
                type: 'Withdrawal',
                amount: -withdrawalAmount, // Withdrawals are negative amounts
                status: 'Pending',
                withdrawalDetails: {
                    accountName,
                    accountNumber,
                    method,
                }
            });

            toast({
                title: t('withdraw.successTitle'),
                description: t('withdraw.successDescription'),
            })

            // Clear form
            setAmount("");
            setAccountName("");
            setAccountNumber("");

        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Withdrawal Failed",
                description: error.message || "Could not process your withdrawal request.",
            });
        }
    }
  
  const loading = userLoading || settingsLoading;

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('withdraw.title')}</h1>
        <p className="text-muted-foreground">{t('withdraw.description')}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('withdraw.formTitle')}</CardTitle>
          <CardDescription>
            {loading ? <Skeleton className="h-5 w-48"/> : `Your current balance is ${new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(user?.balance || 0)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label className="mb-2 block">{t('withdraw.method')}</Label>
                <RadioGroup value={method} onValueChange={setMethod} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="jazzcash" id="jazzcash" />
                        <Label htmlFor="jazzcash">JazzCash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="easypaisa" id="easypaisa" />
                        <Label htmlFor="easypaisa">Easypaisa</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="account-number">{t('withdraw.accountNumber')}</Label>
                <Input id="account-number" type="tel" placeholder="03xxxxxxxxx" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="account-name">{t('withdraw.accountName')}</Label>
                <Input id="account-name" type="text" placeholder="Satoshi Nakamoto" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="amount">{t('withdraw.amount')}</Label>
                <Input id="amount" type="number" placeholder="1000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                 {settings?.withdrawalFee && <p className="text-xs text-muted-foreground pt-1">A {settings.withdrawalFee}% fee will be deducted. Funds will be transferred within 12-24 hours.</p>}
                 {settings && (settings.minWithdrawal || settings.maxWithdrawal) && (
                    <p className="text-xs text-muted-foreground pt-1">
                        Withdraw between PKR {settings.minWithdrawal || 0} and PKR {settings.maxWithdrawal || 'unlimited'}.
                    </p>
                 )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                <Landmark className="mr-2 h-4 w-4" />
                {t('withdraw.submitButton')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <WithdrawalHistory />
    </div>
  )
}
