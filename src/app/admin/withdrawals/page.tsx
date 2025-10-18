
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
import { type Transaction } from "@/lib/data"
import { Search, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore } from "@/firebase/provider"
import { listenToAllTransactions, updateTransactionStatus } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminWithdrawalsHistoryPage from "./history/page"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function AdminWithdrawalsPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [allTransactions, setAllTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  React.useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToAllTransactions(firestore, (transactions) => {
        setAllTransactions(transactions.filter(tx => tx.type === 'Withdrawal'));
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const pendingWithdrawals = React.useMemo(() => {
    const filtered = allTransactions.filter(tx => tx.status === 'Pending');
    if (!searchTerm) return filtered;
    const lowercasedFilter = searchTerm.toLowerCase();
    return filtered.filter(item => {
      return (
        item.id.toLowerCase().includes(lowercasedFilter) ||
        item.userName.toLowerCase().includes(lowercasedFilter) ||
        item.userId.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [searchTerm, allTransactions]);

  const processedWithdrawals = React.useMemo(() => {
      return allTransactions.filter(tx => tx.status !== 'Pending');
  }, [allTransactions]);
  
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return 'N/A';
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(val);
  }

  const handleAction = async (transaction: Transaction, status: 'Completed' | 'Failed') => {
    if (!firestore) return;
    try {
      await updateTransactionStatus(firestore, transaction.id, status, transaction);
      toast({
        title: `Withdrawal ${status}`,
        description: `Transaction has been updated.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.message || "Could not update withdrawal status.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
        <p className="text-muted-foreground">Review and approve pending withdrawals from all users and partners.</p>
      </div>
        <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                <Card>
                    <CardHeader>
                    <CardTitle>Pending Withdrawal Requests</CardTitle>
                    <CardDescription>A list of all withdrawals awaiting approval.</CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Search by transaction ID, user name or UID..."
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
                            <TableHead>Role</TableHead>
                            <TableHead>Account Details</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-24" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-8 w-40 mx-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : pendingWithdrawals.length > 0 ? (
                            pendingWithdrawals.map((withdrawal) => (
                                <TableRow key={withdrawal.id}>
                                <TableCell>
                                    <div className="font-medium">{withdrawal.userName}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(withdrawal.date).toLocaleString()}
                                    </div>
                                </TableCell>
                                 <TableCell>
                                  <Badge variant={withdrawal.userRole === 'partner' ? 'secondary' : 'outline'} className="capitalize">
                                    {withdrawal.userRole || 'user'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                    {withdrawal.withdrawalDetails && (
                                        <div className="text-sm space-y-1">
                                        <p><span className="font-semibold">Holder:</span> {withdrawal.withdrawalDetails.accountName}</p>
                                        <p><span className="font-semibold">Number:</span> {withdrawal.withdrawalDetails.accountNumber}</p>
                                        <p><span className="font-semibold">Method:</span> {withdrawal.withdrawalDetails.method}</p>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-destructive font-medium">
                                    {formatCurrency(Math.abs(withdrawal.amount))}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" size="sm" onClick={() => handleAction(withdrawal, 'Completed')}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleAction(withdrawal, 'Failed')}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No pending withdrawals found.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history">
                <AdminWithdrawalsHistoryPage transactions={processedWithdrawals} loading={loading} />
            </TabsContent>
        </Tabs>
    </div>
  )
}
