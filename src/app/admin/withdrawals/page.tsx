
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
import { type Transaction } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Search, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore } from "@/firebase/provider"
import { listenToAllTransactions, updateTransactionStatus } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminWithdrawalsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const firestore = useFirestore()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  React.useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToAllTransactions(firestore, (allTransactions) => {
        setTransactions(allTransactions.filter(tx => tx.type === 'Withdrawal'));
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const filteredWithdrawals = React.useMemo(() => {
    if (!searchTerm) return transactions;
    const lowercasedFilter = searchTerm.toLowerCase();
    return transactions.filter(item => {
      return (
        item.id.toLowerCase().includes(lowercasedFilter) ||
        item.userName.toLowerCase().includes(lowercasedFilter) ||
        item.status.toLowerCase().includes(lowercasedFilter) ||
        item.userId.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [searchTerm, transactions]);

  const handleAction = async (transactionId: string, status: 'Completed' | 'Failed') => {
    if (!firestore) return;
    try {
        await updateTransactionStatus(firestore, transactionId, status)
        const action = status === 'Completed' ? 'approved' : 'rejected';
        toast({
          title: `Withdrawal ${action}`,
          description: `Transaction ${transactionId} has been ${action}.`,
        })
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Action Failed",
            description: error.message || "Could not update the transaction status.",
        });
    }
  }

  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Pending': return 'secondary'
      case 'Failed': return 'destructive'
      default: return 'outline'
    }
  }
  
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return 'N/A';
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  }

  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.withdrawals')}</h1>
        <p className="text-muted-foreground">Review and process all user withdrawal requests.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>A list of all withdrawal requests from users.</CardDescription>
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
                <TableHead>Transaction ID</TableHead>
                <TableHead>Account & User Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount (USD)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-8 w-40 mx-auto" /></TableCell>
                    </TableRow>
                ))
              ) : filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">{withdrawal.id}</TableCell>
                    <TableCell>
                        <div className="font-medium">{withdrawal.userName}</div>
                        <div className="text-sm text-muted-foreground">
                            <span className="font-semibold">UID:</span> {withdrawal.userId}
                        </div>
                        {withdrawal.withdrawalDetails && (
                            <div className="text-xs space-y-1 mt-2">
                            <p><span className="font-semibold">Holder:</span> {withdrawal.withdrawalDetails.accountName}</p>
                            <p><span className="font-semibold">Number:</span> {withdrawal.withdrawalDetails.accountNumber}</p>
                            <p><span className="font-semibold">Method:</span> {withdrawal.withdrawalDetails.method}</p>
                             {withdrawal.withdrawalDetails.fee !== undefined && (
                                <p><span className="font-semibold">Fee:</span> <span className="text-destructive">{formatCurrency(withdrawal.withdrawalDetails.fee)}</span></p>
                            )}
                            </div>
                        )}
                    </TableCell>
                    <TableCell>{withdrawal.date}</TableCell>
                    <TableCell className="text-right text-destructive">
                        {formatCurrency(Math.abs(withdrawal.amount))}
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant={getStatusVariant(withdrawal.status)}>
                        {withdrawal.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        {withdrawal.status === 'Pending' ? (
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" size="sm" onClick={() => handleAction(withdrawal.id, 'Completed')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleAction(withdrawal.id, 'Failed')}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                            </Button>
                        </div>
                        ) : (
                        <span className="text-xs text-muted-foreground">No actions</span>
                        )}
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No withdrawal requests found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
