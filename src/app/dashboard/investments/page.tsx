"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockUser, mockInvestmentPlans } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import { Lock } from "lucide-react"

export default function InvestmentsPage() {
  const { t } = useTranslation()
  const userVipLevel = mockUser.vipLevel

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
                  <span className="text-muted-foreground">Daily Return</span>
                  <span className="font-semibold text-primary">{plan.dailyReturn}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold">{plan.durationDays} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment</span>
                  <span className="font-semibold">
                    ${plan.minInvestment} - ${plan.maxInvestment}
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
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    {t('investments.invest')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
