
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { Copy, Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addTransaction, appSettings } from "@/lib/data"

export default function DepositPage() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const router = useRouter()
    const [copied, setCopied] = useState(false)
    const [yourNumber, setYourNumber] = useState("")
    const [amount, setAmount] = useState("")
    const [tid, setTid] = useState("")
    const [receipt, setReceipt] = useState<File | null>(null)


    const handleCopy = () => {
        navigator.clipboard.writeText(appSettings.adminWalletNumber)
        setCopied(true)
        toast({
            description: t('referrals.copied'),
        })
        setTimeout(() => setCopied(false), 2000)
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        const newDeposit = {
            id: `TXN${Math.floor(Math.random() * 1000000)}`,
            type: 'Deposit' as const,
            date: new Date().toISOString().split('T')[0],
            amount: parseFloat(amount),
            status: 'Pending' as const,
        };

        addTransaction(newDeposit);

        toast({
            title: "Deposit Request Submitted",
            description: "Your deposit is being reviewed and will be processed shortly.",
        })

        router.push('/dashboard/transactions')
    }

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
           <div className="flex items-center space-x-2 rounded-md border border-dashed p-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{t('deposit.adminWallet')} ({appSettings.adminWalletName})</p>
                  <p className="text-sm text-muted-foreground">{appSettings.adminWalletNumber}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="h-5 w-5" />
                </Button>
            </div>
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
                <Button type="submit" className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    {t('deposit.submitButton')}
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}
