
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslation } from "@/hooks/use-translation"
import { Landmark } from "lucide-react"

export default function WithdrawPage() {
    const { t } = useTranslation()

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
        <CardContent className="space-y-6">
            <div>
                <Label className="mb-2 block">{t('withdraw.method')}</Label>
                <RadioGroup defaultValue="jazzcash" className="flex gap-4">
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
                <Input id="account-number" type="tel" placeholder="03xxxxxxxxx" />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="account-name">{t('withdraw.accountName')}</Label>
                <Input id="account-name" type="text" placeholder="Satoshi Nakamoto" />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="amount">{t('withdraw.amount')}</Label>
                <Input id="amount" type="number" placeholder="1000" />
                 <p className="text-xs text-muted-foreground pt-1">{t('withdraw.feeNotice')}</p>
            </div>
            <Button type="submit" className="w-full">
                <Landmark className="mr-2 h-4 w-4" />
                {t('withdraw.submitButton')}
            </Button>
        </CardContent>
      </Card>
    </div>
  )
}
