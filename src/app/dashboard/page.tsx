
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockTransactions, mockAnnouncements } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Megaphone } from "lucide-react"

function Announcement() {
    if (mockAnnouncements.length === 0) {
        return null;
    }

    const latestAnnouncement = mockAnnouncements[0];

    return (
        <Alert>
            <Megaphone className="h-4 w-4" />
            <AlertTitle>Announcement!</AlertTitle>
            <AlertDescription>
                {latestAnnouncement.message}
            </AlertDescription>
        </Alert>
    )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, loading } = useUser();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(amount)
  }

  const recentTransactions = mockTransactions.slice(0, 5)

  const getStatusVariant = (status: (typeof mockTransactions)[0]['status']) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Pending': return 'secondary'
      case 'Failed': return 'destructive'
      default: return 'outline'
    }
  }

  if (loading) {
      return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <Card className="sm:col-span-2">
                    <CardHeader className="pb-3">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-36" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('dashboard.balance')}</CardDescription>
                         <Skeleton className="h-10 w-3/4" />
                    </CardHeader>
                    <CardContent>
                       <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('dashboard.vipLevel')}</CardDescription>
                        <Skeleton className="h-10 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-3 w-1/2 mt-2" />
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>{t('profile.recentTransactions')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div className="flex justify-between items-center" key={i}>
                          <div className="flex flex-col gap-2">
                             <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      )
  }

  if (!user) {
    return <div>Please log in to see your dashboard.</div>
  }

  const userFirstName = user.displayName?.split(" ")[0]

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <Announcement />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t('dashboard.welcome', { name: userFirstName })}</CardTitle>
            <CardDescription className="max-w-lg text-balance leading-relaxed">
              {t('dashboard.welcomeSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/investments">{t('dashboard.viewInvestments')}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.balance')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {formatCurrency(user.balance)}
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
              {t('dashboard.vipLevelValue', { level: user.vipLevel })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={user.vipProgress} aria-label={`${user.vipProgress}% to next level`} />
            <div className="text-xs text-muted-foreground mt-2">
              {user.vipProgress}% {t('dashboard.vipProgress')}
            </div>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>{t('profile.recentTransactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{t('transactions.id')}</TableHead>
                    <TableHead>{t('transactions.type')}</TableHead>
                    <TableHead>{t('transactions.date')}</TableHead>
                    <TableHead className="text-right">{t('transactions.amount')}</TableHead>
                    <TableHead className="text-center">{t('transactions.status')}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant={getStatusVariant(transaction.status)}>
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
  )
}
