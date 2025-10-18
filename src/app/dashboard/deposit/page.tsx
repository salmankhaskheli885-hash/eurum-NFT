
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { Copy, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type AppSettings, type Transaction } from "@/lib/data"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { addTransaction, listenToAppSettings, listenToUserTransactions } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function DepositPage() {
    const { t } = useTranslation()
    const { user, loading: userLoading } = useUser()
    const { toast } = useToast()
    const router = useRouter()
    const firestore = useFirestore()

    const [settings, setSettings] = useState<AppSettings | null>(null)
    const [settingsLoading, setSettingsLoading] = useState(true)

    const [copied, setCopied] = useState(false)
    const [yourNumber, setYourNumber] = useState("")
    const [amount, setAmount] = useState("")
    const [tid, setTid] = useState("")
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // State for deposit history
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)

    useEffect(() => {
        if (!firestore) return;
        setSettingsLoading(true);
        const unsubscribe = listenToAppSettings(firestore, (newSettings) => {
            setSettings(newSettings);
            setSettingsLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);
    
    // useEffect for fetching deposit history
    useEffect(() => {
        if (!user || !firestore) {
            if (!userLoading) setHistoryLoading(false);
            return;
        };
        setHistoryLoading(true);
        const unsubscribe = listenToUserTransactions(firestore, user.uid, (allTransactions) => {
            const depositTxs = allTransactions
                .filter(tx => tx.type === 'Deposit')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(depositTxs);
            setHistoryLoading(false);
        });
        return () => unsubscribe();
    }, [user, firestore, userLoading]);

    const handleCopy = () => {
        if (!settings) return;
        const textToCopy = `
        Account Name: ${settings.adminAccountHolderName}
        Account Number: ${settings.adminWalletNumber}
        Wallet: ${settings.adminWalletName}
        `;
        navigator.clipboard.writeText(textToCopy.trim())
        setCopied(true)
        toast({
            description: t('referrals.copied'),
        })
        setTimeout(() => setCopied(false), 2000)
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!receiptFile) {
             toast({
                variant: "destructive",
                title: "Receipt Required",
                description: "Please upload a payment receipt to continue.",
            })
            return
        }

        if (!user || !firestore || !settings) {
            toast({
                variant: "destructive",
                title: "Not Logged In",
                description: "You must be logged in to make a deposit.",
            })
            return
        }
        
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid positive number for the amount.' });
            return;
        }

        if (settings.minDeposit && depositAmount < settings.minDeposit) {
            toast({ variant: 'destructive', title: `Minimum deposit is PKR ${settings.minDeposit}` });
            return;
        }
        if (settings.maxDeposit && depositAmount > settings.maxDeposit) {
            toast({ variant: 'destructive', title: `Maximum deposit is PKR ${settings.maxDeposit}` });
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await addTransaction(firestore, {
                userId: user.uid,
                userName: user.displayName || 'Unknown User',
                type: 'Deposit',
                amount: parseFloat(amount),
                status: 'Pending', 
                receiptFile: receiptFile,
                details: `Deposit via ${yourNumber} with TID: ${tid}`
            });

             toast({
                title: "Deposit Request Submitted",
                description: "Your deposit is being processed and will reflect in your balance shortly.",
            });
            // Clear form
            setAmount("");
            setYourNumber("");
            setTid("");
            setReceiptFile(null);
        } catch (error: any) {
            console.error("Deposit submission error:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: error.message || "Could not submit your deposit request.",
            })
        } finally {
            setIsSubmitting(false);
        };
    }
    
    // Helper functions for rendering history
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

    const isLoading = userLoading || settingsLoading;
    const isHistoryLoading = userLoading || historyLoading;

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('deposit.title')}</h1>
        <p className="text-muted-foreground">{t('deposit.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('deposit.instructionsTitle')}</CardTitle>
           <CardDescription>
            {t('deposit.instructionsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4 rounded-md border border-dashed p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-2/3" />
                </div>
            ) : settings ? (
                <div className="flex items-center space-x-2 rounded-md border border-dashed p-4">
                    <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium leading-none">
                        Account Name: <span className="text-muted-foreground">{settings.adminAccountHolderName}</span>
                    </p>
                    <p className="text-sm font-medium leading-none">
                        Account Number: <span className="text-muted-foreground">{settings.adminWalletNumber}</span>
                    </p>
                    <p className="text-sm font-medium leading-none">
                        Wallet: <span className="text-muted-foreground">{settings.adminWalletName}</span>
                    </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
            ) : <p>Could not load deposit information.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('deposit.formTitle')}</CardTitle>
          <CardDescription>{t('deposit.formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="your-number">{t('deposit.yourNumber')}</Label>
                    <Input id="your-number" type="tel" placeholder="03xxxxxxxxx" value={yourNumber} onChange={(e) => setYourNumber(e.target.value)} required />
                </div>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="amount">{t('deposit.amount')}</Label>
                    <Input id="amount" type="number" placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    {settings && (settings.minDeposit) && (
                        <p className="text-xs text-muted-foreground pt-1">
                           Minimum deposit is PKR {settings.minDeposit || 0}.
                        </p>
                    )}
                </div>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="tid-number">{t('deposit.tidNumber')}</Label>
                    <Input id="tid-number" type="text" placeholder="A1B2C3D4E5" value={tid} onChange={(e) => setTid(e.target.value)} required />
                </div>
                 <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="receipt">Payment Receipt (Required)</Label>
                    <Input id="receipt" type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files ? e.target.files[0] : null)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        t('deposit.submitButton')
                    )}
                </Button>
            </form>
        </CardContent>
      </Card>
      
      <Card>
            <CardHeader>
                <CardTitle>Deposit History</CardTitle>
                <CardDescription>A list of your past deposits.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isHistoryLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{formatDate(tx.date)}</TableCell>
                                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(tx.amount)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">No deposits found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
