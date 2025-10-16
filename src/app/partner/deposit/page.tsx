
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { type AppSettings } from "@/lib/data"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { addTransaction, listenToAppSettings } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"

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
    const [receipt, setReceipt] = useState<File | null>(null)

    useEffect(() => {
        if (!firestore) return;
        setSettingsLoading(true);
        const unsubscribe = listenToAppSettings(firestore, (newSettings) => {
            setSettings(newSettings);
            setSettingsLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);


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
        if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "Not Logged In",
                description: "You must be logged in to make a deposit.",
            })
            return
        }
        
        try {
            await addTransaction(firestore, {
                userId: user.uid,
                userName: user.displayName || 'Unknown User',
                type: 'Deposit',
                amount: parseFloat(amount),
                status: 'Pending',
            });

            toast({
                title: "Deposit Request Submitted",
                description: "Your deposit is being reviewed and will be processed shortly.",
            })

            router.push('/partner/transactions')
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Could not submit your deposit request.",
            })
        }
    }

  const isLoading = userLoading || settingsLoading;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
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
                </div>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="tid-number">{t('deposit.tidNumber')}</Label>
                    <Input id="tid-number" type="text" placeholder="A1B2C3D4E5" value={tid} onChange={(e) => setTid(e.target.value)} required />
                </div>
                 <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="receipt">Payment Receipt</Label>
                    <Input id="receipt" type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files ? e.target.files[0] : null)} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {t('deposit.submitButton')}
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}
