"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockUser, mockTransactions } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import { DonutChart, type ChartConfig } from "@/components/ui/chart"
import Link from "next/link"
import { ArrowRight, Briefcase, DollarSign, Gift, User as UserIcon } from "lucide-react"

const chartConfig = {
  value: {
    label: "Value",
  },
  stocks: {
    label: "Stocks",
    color: "hsl(var(--chart-1))",
  },
  crypto: {
    label: "Crypto",
    color: "hsl(var(--chart-2))",
  },
  commodities: {
    label: "Commodities",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export default function Dashboard() {
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: mockUser.currency,
    }).format(amount)
  }

  const userFirstName = mockUser.name.split(" ")[0]

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t('dashboard.welcome', { name: userFirstName })}</CardTitle>
            <CardDescription className="max-w-lg text-balance leading-relaxed">
              {t('dashboard.welcomeSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardHeader>
            <Button asChild>
              <Link href="/dashboard/investments">{t('dashboard.viewInvestments')}</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.balance')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {formatCurrency(mockUser.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +25% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.totalReturns')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {formatCurrency(mockUser.totalReturns)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +10% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
          </CardHeader>
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.transactionId')}</TableHead>
                <TableHead>{t('dashboard.transactionType')}</TableHead>
                <TableHead>{t('dashboard.transactionDate')}</TableHead>
                <TableHead className="text-right">{t('dashboard.transactionAmount')}</TableHead>
                <TableHead className="text-center">{t('dashboard.transactionStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.slice(0, 5).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.id}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell className={`text-right ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={transaction.status === 'Completed' ? 'default' : transaction.status === 'Pending' ? 'secondary' : 'destructive'}>
                        {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.portfolioOverview')}</CardTitle>
            <CardDescription>{t('dashboard.portfolioSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={mockUser.portfolio} config={chartConfig} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.assets')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUser.portfolio.map(asset => (
                <div key={asset.name} className="flex items-center">
                  <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mr-4">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(asset.value)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(asset.value)}</p>
                    <p className={`text-sm ${asset.change > 0 ? 'text-green-500' : 'text-red-500'}`}>{asset.change}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" asChild className="h-24 flex-col items-start justify-between p-4">
              <Link href="/dashboard/investments">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{t('dashboard.investments.title')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('dashboard.investments.description')}</p>
                <ArrowRight className="h-4 w-4 self-end" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col items-start justify-between p-4">
              <Link href="/dashboard/profile">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{t('dashboard.profile.title')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('dashboard.profile.description')}</p>
                <ArrowRight className="h-4 w-4 self-end" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col items-start justify-between p-4">
              <Link href="/dashboard/kyc">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{t('dashboard.kyc.title')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('dashboard.kyc.description')}</p>
                <ArrowRight className="h-4 w-4 self-end" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col items-start justify-between p-4">
              <Link href="/dashboard/referrals">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{t('dashboard.referrals.title')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('dashboard.referrals.description')}</p>
                <ArrowRight className="h-4 w-4 self-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
