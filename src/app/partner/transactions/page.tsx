
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/hooks/use-user"
import { listenToUserTransactions } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TransactionsPage() {
  const { t } = useTranslation()
  const firestore = useFirestore()
  const { user, loading: userLoading } = useUser()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    if (!firestore || !user?.uid) return;
    setLoading(true);
    const unsubscribe = listenToUserTransactions(firestore, user.uid, (newTransactions) => {
        setTransactions(newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, user?.uid]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 2,
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }

  const filteredTransactions = React.useMemo(() => {
    let items = transactions;

    if (activeTab === "deposits") {
      items = transactions.filter(tx => tx.type === 'Deposit');
    } else if (activeTab === "withdrawals") {
      items = transactions.filter(tx => tx.type === 'Withdrawal');
    } else if (activeTab === "others") {
      items = transactions.filter(tx => tx.type !== 'Deposit' && tx.type !== 'Withdrawal');
    }

    if (!searchTerm) return items;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    return items.filter(tx =>
        tx.id.toLowerCase().includes(lowercasedFilter) ||
        tx.type.toLowerCase().includes(lowercasedFilter) ||
        (tx.details && tx.details.toLowerCase().includes(lowercasedFilter))
    );
  }, [transactions, activeTab, searchTerm]);

  const renderTable = (transactionsToRender: Transaction[], isLoading: boolean) => (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('transactions.id')}</TableHead>
          <TableHead>{t('transactions.type')}</TableHead>
          <TableHead>Date</TableHead>
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
        ) : transactionsToRender.length > 0 ? (
          transactionsToRender.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.id.substring(0,8)}...</TableCell>
              <TableCell>{transaction.type}</TableCell>
              <TableCell>{formatDate(transaction.date)}</TableCell>
              <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={transaction.status === 'Failed' ? 'destructive' : transaction.status === 'Completed' ? 'default' : 'secondary'}
                  className={cn(
                    transaction.status === 'Completed' && 'bg-green-600 hover:bg-green-700'
                  )}
                >
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
        <CardHeader>
            <CardTitle>Your Transactions</CardTitle>
            <CardDescription>
                Filter and search through your entire transaction history.
            </CardDescription>
            <div className="relative pt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search by ID, type, or details..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">{t('transactions.all')}</TabsTrigger>
              <TabsTrigger value="deposits">{t('transactions.deposits')}</TabsTrigger>
              <TabsTrigger value="withdrawals">{t('transactions.withdrawals')}</TabsTrigger>
              <TabsTrigger value="others">Others</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              {renderTable(filteredTransactions, userLoading || loading)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
