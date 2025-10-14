"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Copy, Check } from "lucide-react"
import { mockUser } from "@/lib/data"

export default function ReferralsPage() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(mockUser.referralLink)
        setCopied(true)
        toast({
            description: t('referrals.copied'),
        })
        setTimeout(() => setCopied(false), 2000)
    }

    return (
         <div className="flex flex-col gap-4 max-w-2xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('referrals.title')}</h1>
                <p className="text-muted-foreground">{t('referrals.description')}</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('referrals.yourLink')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            type="text"
                            value={mockUser.referralLink}
                            readOnly
                            className="flex-grow"
                        />
                        <Button variant="outline" size="icon" onClick={handleCopy}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            <span className="sr-only">{t('referrals.copy')}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
