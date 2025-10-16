
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, FileUp, Info, XCircle } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/components/ui/use-toast"
import { useFirestore } from "@/firebase/provider"
import { submitKyc } from "@/lib/firestore"
import type { UserProfile } from "@/lib/schema"


function KycStatusCard({ status }: { status: UserProfile['kycStatus']}) {
    const { t } = useTranslation()

    const statusConfig = {
        unsubmitted: {
            title: t('kyc.statusCard.unsubmitted.title'),
            description: t('kyc.statusCard.unsubmitted.description'),
            icon: Info,
            variant: "default" as const,
        },
        pending: {
            title: t('kyc.statusCard.pending.title'),
            description: t('kyc.statusCard.pending.description'),
            icon: Clock,
            variant: "default" as const,
        },
        approved: {
            title: t('kyc.statusCard.approved.title'),
            description: t('kyc.statusCard.approved.description'),
            icon: CheckCircle,
            variant: "default" as const, // You can create a "success" variant if you want
        },
        rejected: {
            title: t('kyc.statusCard.rejected.title'),
            description: t('kyc.statusCard.rejected.description'),
            icon: XCircle,
            variant: "destructive" as const,
        },
    }

    const currentStatus = statusConfig[status]

    return (
         <Alert variant={currentStatus.variant}>
            <currentStatus.icon className="h-4 w-4" />
            <AlertTitle>{currentStatus.title}</AlertTitle>
            <AlertDescription>{currentStatus.description}</AlertDescription>
        </Alert>
    )
}

export default function KycForm({ user }: { user: UserProfile }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const firestore = useFirestore()
  
  const [mobileNumber, setMobileNumber] = React.useState("")
  const [cnicFront, setCnicFront] = React.useState<File | null>(null)
  const [cnicBack, setCnicBack] = React.useState<File | null>(null)
  const [selfie, setSelfie] = React.useState<File | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mobileNumber || !cnicFront || !cnicBack || !selfie || !firestore) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill all fields and upload all required documents.",
        })
        return
    }

    setSubmitting(true)
    try {
        // In a real app, you would upload files to Firebase Storage and get the URLs.
        // For this demo, we'll just pass placeholder URLs.
        await submitKyc(firestore, user.uid, {
            mobileNumber,
            cnicFrontUrl: "placeholder_url",
            cnicBackUrl: "placeholder_url",
            selfieUrl: "placeholder_url"
        });

        toast({
            title: t('kyc.successTitle'),
            description: t('kyc.successDescription'),
        })

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.message || "Could not submit your KYC documents.",
        })
    } finally {
        setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('kyc.title')}</h1>
            <p className="text-muted-foreground">{t('kyc.description')}</p>
        </div>
         <Badge variant={user.kycStatus === 'approved' ? 'default' : user.kycStatus === 'rejected' ? 'destructive' : 'secondary'}>
            {t(`kyc.statusPill.${user.kycStatus}`)}
        </Badge>
      </div>

      <KycStatusCard status={user.kycStatus} />

      {user.kycStatus !== 'approved' && user.kycStatus !== 'pending' && (
        <Card>
            <CardHeader>
            <CardTitle>{t('kyc.formTitle')}</CardTitle>
            <CardDescription>{t('kyc.formDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="mobile-number">{t('kyc.mobileNumber')}</Label>
                    <Input id="mobile-number" type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                </div>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cnic-front">{t('kyc.cnicFront')}</Label>
                    <Input id="cnic-front" type="file" onChange={(e) => setCnicFront(e.target.files ? e.target.files[0] : null)} required />
                </div>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cnic-back">{t('kyc.cnicBack')}</Label>
                    <Input id="cnic-back" type="file" onChange={(e) => setCnicBack(e.target.files ? e.target.files[0] : null)} required />
                </div>
                 <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="selfie">{t('kyc.selfie')}</Label>
                    <Input id="selfie" type="file" onChange={(e) => setSelfie(e.target.files ? e.target.files[0] : null)} required />
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                    <FileUp className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting..." : t('kyc.submitButton')}
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  )
}
