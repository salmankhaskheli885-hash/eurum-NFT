
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslation } from "@/hooks/use-translation"
import { Landmark } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addTransaction } from "@/lib/data"

export default function WithdrawPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { toast } = useToast()
    const [method, setMethod] = useState("jazzcash")
    const [accountNumber, setAccountNumber] = useState("")
    const [accountName, setAccountName] = useState("")
    const [amount, setAmount] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        const newWithdrawal = {
            id: `TXN${Math.floor(Math.random() * 1000000)}`,
            type: 'Withdrawal' as const,
            date: new Date().toISOString().split('T')[0],
            amount: -parseFloat(amount), // Withdrawals are negative amounts
            status: 'Pending' as const,
        };

        addTransaction(newWithdrawal);

        toast({
            title: t('withdraw.successTitle'),
            description: t('withdraw.successDescription'),
        })

        // Redirect to transaction history page
        router.push('/dashboard/transactions')
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
                 <p className="text-xs text-muted-foreground pt-1">{t('withdraw.feeNotice')}</p>
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
