
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
import { useTranslation } from "@/hooks/use-translation"
import { mockReferredUsers } from "@/lib/data"
import { DollarSign, Users, TrendingUp } from "lucide-react"

export default function ReferralsPage() {
  const { t } = useTranslation()

  const totalReferredUsers = mockReferredUsers.length;
  const totalDeposits = mockReferredUsers.reduce((acc, user) => acc + user.totalDeposit, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('referrals.title')}</h1>
        <p className="text-muted-foreground">{t('referrals.description')}</p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('referrals.totalReferredUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferredUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('referrals.totalDeposits')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposits)}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('partner.referrals.commissionRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10%</div>
             <p className="text-xs text-muted-foreground">{t('referrals.commissionNotice')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('referrals.referredUsersList')}</CardTitle>
          <CardDescription>{t('referrals.referredUsersListDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('referrals.table.name')}</TableHead>
                <TableHead className="text-right">{t('referrals.table.totalDeposit')}</TableHead>
                <TableHead className="text-center">{t('referrals.table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReferredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(user.totalDeposit)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                      {t(`referrals.table.statusValue.${user.status.toLowerCase()}`)}
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
