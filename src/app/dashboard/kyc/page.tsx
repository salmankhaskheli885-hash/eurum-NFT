"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { mockUser } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import { Upload } from "lucide-react"

export default function KycPage() {
    const { t } = useTranslation();
    const { kycStatus } = mockUser;

    const statusText = t(`kyc.statusPill.${kycStatus}`);
    const statusVariant = {
        approved: "default",
        pending: "secondary",
        rejected: "destructive",
        unsubmitted: "outline",
    }[kycStatus] as "default" | "secondary" | "destructive" | "outline";


  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('kyc.title')}</h1>
            <p className="text-muted-foreground">{t('kyc.description')}</p>
        </div>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <CardTitle className="flex-grow">{t('kyc.status')}</CardTitle>
                    <Badge variant={statusVariant} className="text-sm">{statusText}</Badge>
                </div>
            </CardHeader>
            {kycStatus !== 'approved' && (
                <CardContent className="space-y-6">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="cnic-upload">{t('kyc.uploadCnic')}</Label>
                        <Input id="cnic-upload" type="file" disabled={kycStatus === 'pending'} />
                    </div>
                     <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="photo-upload">{t('kyc.uploadPhoto')}</Label>
                        <Input id="photo-upload" type="file" disabled={kycStatus === 'pending'} />
                    </div>
                    <Button type="submit" className="w-full" disabled={kycStatus === 'pending'}>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('kyc.submit')}
                    </Button>
                </CardContent>
            )}
        </Card>
    </div>
  )
}
