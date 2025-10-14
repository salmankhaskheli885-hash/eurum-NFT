
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
import { mockUser } from "@/lib/data"
import { DollarSign, Users, TrendingUp } from "lucide-react"

const mockPartners = [
  { id: "partner-1", name: "Alice", level: 1, commission: 150.75, status: "Active" },
  { id: "partner-2", name: "Bob", level: 2, commission: 305.50, status: "Active" },
  { id: "partner-3", name: "Charlie", level: 1, commission: 95.20, status: "Inactive" },
  { id: "partner-4", name: "David", level: 3, commission: 750.00, status: "Active" },
  { id: "partner-5", name: "Eve", level: 1, commission: 120.00, status: "Active" },
];

export default function PartnersPage() {
  const { t } = useTranslation()

  const totalPartners = mockPartners.length;
  const totalCommission = mockPartners.reduce((acc, partner) => acc + partner.commission, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: mockUser.currency,
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('partners.title')}</h1>
        <p className="text-muted-foreground">{t('partners.description')}</p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('partners.totalPartners')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('partners.totalCommission')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommission)}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('partners.commissionRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5% - 15%</div>
             <p className="text-xs text-muted-foreground">{t('partners.basedOnLevel')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('partners.partnerList')}</CardTitle>
          <CardDescription>{t('partners.partnerListDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('partners.table.name')}</TableHead>
                <TableHead>{t('partners.table.level')}</TableHead>
                <TableHead className="text-right">{t('partners.table.commission')}</TableHead>
                <TableHead className="text-center">{t('partners.table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{t('partners.table.levelValue', {level: partner.level})}</TableCell>
                  <TableCell className="text-right">{formatCurrency(partner.commission)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={partner.status === 'Active' ? 'default' : 'secondary'}>
                      {t(`partners.table.statusValue.${partner.status.toLowerCase()}`)}
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
