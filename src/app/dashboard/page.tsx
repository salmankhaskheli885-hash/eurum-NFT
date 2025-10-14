
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockUser, mockTransactions } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(amount)
  }

  const userFirstName = mockUser.name.split(" ")[0]
  const recentTransactions = mockTransactions.slice(0, 3)

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
            <CardDescription>{t('dashboard.vipLevel')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {t('dashboard.vipLevelValue', { level: mockUser.vipLevel })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={mockUser.vipProgress} aria-label={`${mockUser.vipProgress}% to next level`} />
            <div className="text-xs text-muted-foreground mt-2">
              {mockUser.vipProgress}% {t('dashboard.vipProgress')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('profile.recentTransactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{t('profile.transactionId')}</TableHead>
                    <TableHead>{t('profile.transactionType')}</TableHead>
                    <TableHead>{t('profile.transactionDate')}</TableHead>
                    <TableHead className="text-right">{t('profile.transactionAmount')}</TableHead>
                    <TableHead className="text-center">{t('profile.transactionStatus')}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {recentTransactions.map((transaction) => (
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
      </div>
    </div>
  )
}

