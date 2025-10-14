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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { mockTransactions, mockUser } from "@/lib/data"
import type { Transaction } from "@/lib/data"

export default function TransactionsPage() {
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(amount)
  }

  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Pending': return 'secondary'
      case 'Failed': return 'destructive'
      default: return 'outline'
    }
  }

  const deposits = mockTransactions.filter(tx => tx.type === 'Deposit');
  const withdrawals = mockTransactions.filter(tx => tx.type === 'Withdrawal');

  const renderTable = (transactions: Transaction[]) => (
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
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">{transaction.id}</TableCell>
            <TableCell>{transaction.type}</TableCell>
            <TableCell>{transaction.date}</TableCell>
            <TableCell className={`text-right ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(transaction.amount)}</TableCell>
            <TableCell className="text-center">
              <Badge variant={getStatusVariant(transaction.status)}>
                {transaction.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h1>
        <p className="text-muted-foreground">{t('transactions.description')}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{t('transactions.all')}</TabsTrigger>
              <TabsTrigger value="deposits">{t('transactions.deposits')}</TabsTrigger>
              <TabsTrigger value="withdrawals">{t('transactions.withdrawals')}</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {renderTable(mockTransactions)}
            </TabsContent>
            <TabsContent value="deposits">
              {renderTable(deposits)}
            </TabsContent>
            <TabsContent value="withdrawals">
              {renderTable(withdrawals)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
