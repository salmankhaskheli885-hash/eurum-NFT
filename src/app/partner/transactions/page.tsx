
"use client"

import * as React from "react"
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
import { type Transaction } from "@/lib/data"
import { Card, CardContent } from "@/components/ui/card"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/hooks/use-user"
import { listenToUserTransactions } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"


export default function TransactionsPage() {
  const { t } = useTranslation()
  const firestore = useFirestore()
  const { user, loading: userLoading } = useUser()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!firestore || !user?.uid) return;
    setLoading(true);
    const unsubscribe = listenToUserTransactions(firestore, user.uid, (newTransactions) => {
        setTransactions(newTransactions);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, user?.uid]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }

  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Pending': return 'secondary'
      case 'Failed': return 'destructive'
      default: return 'outline'
    }
  }

  const deposits = transactions.filter(tx => tx.type === 'Deposit');
  const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal');
  const allTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderTable = (transactions: Transaction[], isLoading: boolean) => (
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
        {isLoading ? (
            [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                </TableRow>
            ))
        ) : transactions.length > 0 ? (
          transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.id.substring(0,8)}...</TableCell>
              <TableCell>{transaction.type}</TableCell>
              <TableCell>{formatDate(transaction.date)}</TableCell>
              <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={getStatusVariant(transaction.status)}>
                  {transaction.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center h-24">No transactions found.</TableCell>
          </TableRow>
        )}
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
              {renderTable(allTransactions, userLoading || loading)}
            </TabsContent>
            <TabsContent value="deposits">
              {renderTable(deposits, userLoading || loading)}
            </TabsContent>
            <TabsContent value="withdrawals">
              {renderTable(withdrawals, userLoading || loading)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
