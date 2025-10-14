"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { DollarSign, Users, TrendingUp, ShieldCheck, Landmark, Hourglass } from "lucide-react"

export default function AdminDashboardPage() {
  const { t } = useTranslation()

  const stats = [
    { title: t('admin.stats.totalUsers'), value: '1,250', icon: Users },
    { title: t('admin.stats.totalDeposits'), value: 'PKR 2.5M', icon: DollarSign },
    { title: t('admin.stats.pendingWithdrawals'), value: '25', icon: Hourglass },
    { title: t('admin.stats.totalInvested'), value: 'PKR 1.5M', icon: TrendingUp },
    { title: t('admin.stats.pendingKyc'), value: '15', icon: ShieldCheck },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboardTitle')}</h1>
        <p className="text-muted-foreground">{t('admin.dashboardDescription')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>{t('admin.manualActions')}</CardTitle>
                <CardDescription>{t('admin.manualActionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>{t('admin.action.approveWithdrawals')}</li>
                    <li>{t('admin.action.manageUsers')}</li>
                    <li>{t('admin.action.approveKyc')}</li>
                    <li>{t('admin.action.managePlans')}</li>
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>{t('admin.activityLogs')}</CardTitle>
                <CardDescription>{t('admin.activityLogsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">{t('admin.activityPlaceholder')}</p>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
