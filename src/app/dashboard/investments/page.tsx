
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { mockInvestmentPlans } from "@/lib/data"
import type { InvestmentPlan } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import { Lock, Info } from "lucide-react"
import { useUser } from "@/hooks/use-user"

function InvestmentConfirmationDialog({ plan, onConfirm }: { plan: InvestmentPlan, onConfirm: (planName: string) => void }) {
    const { t } = useTranslation()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        }).format(amount)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    {t('investments.invest')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('investments.confirmTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('investments.confirmDescription', { planName: plan.name })}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('investments.planName')}</span>
                        <span className="font-semibold">{plan.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('investments.dailyReturn')}</span>
                        <span className="font-semibold text-primary">{plan.dailyReturn}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('investments.duration')}</span>
                        <span className="font-semibold">{plan.durationDays} {t('investments.days')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('investments.investmentRange')}</span>
                        <span className="font-semibold">
                        {formatCurrency(plan.minInvestment)} - {formatCurrency(plan.maxInvestment)}
                        </span>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('investments.cancel')}</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button type="submit" onClick={() => onConfirm(plan.name)}>{t('investments.confirmButton')}</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function InvestmentsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user } = useUser();
  const userVipLevel = user?.vipLevel ?? 1;

  const handleInvest = (planName: string) => {
    toast({
      title: t('investments.successTitle'),
      description: t('investments.successDescription', { planName }),
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('investments.title')}</h1>
        <p className="text-muted-foreground">{t('investments.description')}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockInvestmentPlans.map((plan) => {
          const isLocked = userVipLevel < plan.requiredVipLevel
          return (
            <Card key={plan.id} className={`flex flex-col ${isLocked ? 'bg-muted/50 border-dashed' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{plan.name}</CardTitle>
                  {isLocked && <Lock className="text-muted-foreground" />}
                </div>
                <CardDescription>
                  {t('investments.requiredVip', { level: plan.requiredVipLevel })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('investments.dailyReturn')}</span>
                  <span className="font-semibold text-primary">{plan.dailyReturn}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('investments.duration')}</span>
                  <span className="font-semibold">{plan.durationDays} {t('investments.days')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('investments.investmentRange')}</span>
                  <span className="font-semibold">
                    {formatCurrency(plan.minInvestment)} - {formatCurrency(plan.maxInvestment)}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                {isLocked ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Lock className="mr-2 h-4 w-4" />
                    {t('investments.locked')}
                  </Button>
                ) : (
                  <InvestmentConfirmationDialog plan={plan} onConfirm={handleInvest} />
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
