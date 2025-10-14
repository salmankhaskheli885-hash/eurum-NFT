"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { DollarSign, Shield, Users } from "lucide-react"

export default function PartnerDashboardPage() {
  const { t } = useTranslation()

  const stats = [
    { title: t('partner.dashboard.totalUsers'), value: '1,250', icon: Users },
    { title: t('partner.dashboard.totalInvested'), value: '$1.5M', icon: DollarSign },
    { title: t('partner.dashboard.pendingKyc'), value: '15', icon: Shield },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('partner.dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('partner.dashboard.description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
