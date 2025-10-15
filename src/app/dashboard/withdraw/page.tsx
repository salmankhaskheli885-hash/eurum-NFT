
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
import { addTransaction, listenToAppSettings } from "@/lib/firestore"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppSettings } from "@/lib/data"

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
            toast({ variant: 'destructive', title: `Minimum withdrawal is $${settings.minWithdrawal}` });
            return;
        }
        if (settings.maxWithdrawal && withdrawalAmount > settings.maxWithdrawal) {
            toast({ variant: 'destructive', title: `Maximum withdrawal is $${settings.maxWithdrawal}` });
            return;
        }
        
        try {
            await addTransaction(firestore, {
                userId: user.uid,
                userName: user.displayName || 'Unknown User',
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

            router.push('/dashboard/transactions')

        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Withdrawal Failed",
                description: error.message || "Could not process your withdrawal request.",
            });
        }
    }
  
  const loading = userLoading || settingsLoading;

  if (loading) {
      return (
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            <div>
                <Skeleton className="h-10 w-48"/>
                <Skeleton className="h-4 w-full mt-2"/>
            </div>
             <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-40"/>
                    <Skeleton className="h-5 w-52 mt-2"/>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full"/>
                    <Skeleton className="h-10 w-full"/>
                    <Skeleton className="h-10 w-full"/>
                    <Skeleton className="h-10 w-full"/>
                    <Skeleton className="h-12 w-full"/>
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('withdraw.title')}</h1>
        <p className="text-muted-foreground">{t('withdraw.description')}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('withdraw.formTitle')}</CardTitle>
          <CardDescription>
            Your current balance is <span className="font-bold text-primary">${user?.balance.toFixed(2)}</span>
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
                        Withdraw between ${settings.minWithdrawal || 0} and ${settings.maxWithdrawal || 'unlimited'}.
                    </p>
                 )}
            </div>
            <Button type="submit" className="w-full">
                <Landmark className="mr-2 h-4 w-4" />
                {t('withdraw.submitButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

    