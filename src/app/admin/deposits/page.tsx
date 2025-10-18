
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import type { Transaction } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { Search, Eye, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore } from "@/firebase/provider"
import { listenToAllTransactions, updateTransactionStatus } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminDepositsHistoryPage from "./history/page"

export default function AdminDepositsPage() {
  const { t } = useTranslation()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  React.useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToAllTransactions(firestore, (allTransactions) => {
        // Reverting to original logic: Show only PENDING deposits that are UNASSIGNED
        setTransactions(allTransactions.filter(tx => tx.type === 'Deposit' && tx.status === 'Pending' && !tx.assignedAgentId));
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const filteredDeposits = React.useMemo(() => {
    if (!searchTerm) return transactions;
    const lowercasedFilter = searchTerm.toLowerCase();
    return transactions.filter(item => {
      return (
        item.id.toLowerCase().includes(lowercasedFilter) ||
        item.userName.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [searchTerm, transactions]);

 const handleAction = async (transaction: Transaction, status: 'Completed' | 'Failed') => {
    if (!firestore) return;
    try {
      await updateTransactionStatus(firestore, transaction.id, status, transaction);
      toast({
        title: `Deposit ${status}`,
        description: `Transaction has been updated.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.message || "Could not update deposit status.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">User & Partner Deposits</h1>
        <p className="text-muted-foreground">Review and approve pending deposits.</p>
      </div>
        <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                 <Card>
                    <CardHeader>
                    <CardTitle>Pending Deposit Requests</CardTitle>
                    <CardDescription>A list of all unassigned deposits awaiting approval.</CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Search by transaction ID or user..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead className="text-right">Amount (PKR)</TableHead>
                            <TableHead className="text-center">Receipt</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-8 w-40 mx-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredDeposits.length > 0 ? (
                            filteredDeposits.map((deposit) => (
                                <TableRow key={deposit.id}>
                                <TableCell>
                                    <div className="font-medium">{deposit.userName}</div>
                                    <div className="text-sm text-muted-foreground">{deposit.id}</div>
                                </TableCell>
                                <TableCell>{new Date(deposit.date).toLocaleString()}</TableCell>
                                <TableCell className="text-right">{deposit.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-center">
                                    {deposit.receiptUrl ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={deposit.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                <Eye className="mr-2 h-4 w-4"/>
                                                View Receipt
                                            </a>
                                        </Button>
                                    ) : (
                                        <Badge variant="secondary">No Receipt</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" size="sm" onClick={() => handleAction(deposit, 'Completed')}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleAction(deposit, 'Failed')}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No pending deposits found.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history">
                <AdminDepositsHistoryPage />
            </TabsContent>
        </Tabs>
    </div>
  )
}
