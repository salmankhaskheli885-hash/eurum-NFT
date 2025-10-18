
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
import { Badge } from "@/components/ui/badge"
import { type Transaction } from "@/lib/data"
import { Search, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore } from "@/firebase/provider"
import { listenToAllTransactions } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function AdminDepositsHistoryPage() {
  const firestore = useFirestore()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  React.useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToAllTransactions(firestore, (allTransactions) => {
        // Filter for processed deposits (was not filtering by role before)
        setTransactions(allTransactions.filter(tx => tx.type === 'Deposit' && tx.status !== 'Pending'));
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
        item.userName.toLowerCase().includes(lowercasedFilter) ||
        item.status.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [searchTerm, transactions]);


  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Failed': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle>User & Partner Deposit History</CardTitle>
          <CardDescription>A list of all processed (Completed/Failed) deposits.</CardDescription>
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
                <TableHead>Transaction ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-right">Amount (PKR)</TableHead>
                <TableHead className="text-center">Receipt</TableHead>
                <TableHead className="text-center">Final Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                    </TableRow>
                ))
              ) : filteredDeposits.length > 0 ? (
                filteredDeposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                    <TableCell className="font-medium">{deposit.id}</TableCell>
                    <TableCell>{deposit.userName}</TableCell>
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
                        <Badge variant={getStatusVariant(deposit.status)}>
                        {deposit.status}
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No processed deposits found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  )
}
