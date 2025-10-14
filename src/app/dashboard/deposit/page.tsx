
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { Banknote, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

// This would typically come from a remote config or database
const ADMIN_WALLET_NUMBER = "0300-1234567"

export default function DepositPage() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(ADMIN_WALLET_NUMBER)
        setCopied(true)
        toast({
            description: t('referrals.copied'),
        })
        setTimeout(() => setCopied(false), 2000)
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
                  <p className="text-sm font-medium leading-none">{t('deposit.adminWallet')}</p>
                  <p className="text-sm text-muted-foreground">{ADMIN_WALLET_NUMBER}</p>
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
        <CardContent className="space-y-6">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="your-number">{t('deposit.yourNumber')}</Label>
            <Input id="your-number" type="tel" placeholder="03xxxxxxxxx" />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="amount">{t('deposit.amount')}</Label>
            <Input id="amount" type="number" placeholder="5000" />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="tid-number">{t('deposit.tidNumber')}</Label>
            <Input id="tid-number" type="text" placeholder="A1B2C3D4E5" />
          </div>
          <Button type="submit" className="w-full">
            <Banknote className="mr-2 h-4 w-4" />
            {t('deposit.submitButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
