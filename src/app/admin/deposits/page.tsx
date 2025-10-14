
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
import { mockTransactions, type Transaction, updateTransactionStatus } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Search, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminDepositsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [key, setKey] = React.useState(Date.now()) // To force re-render

  const deposits = React.useMemo(() => mockTransactions.filter(tx => tx.type === 'Deposit'), [key]);
  const [filteredDeposits, setFilteredDeposits] = React.useState(deposits)

  React.useEffect(() => {
    setFilteredDeposits(deposits);
  }, [deposits]);

  React.useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = deposits.filter(item => {
      return (
        item.id.toLowerCase().includes(lowercasedFilter) ||
        item.userName.toLowerCase().includes(lowercasedFilter) ||
        item.status.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredDeposits(filteredData);
  }, [searchTerm, deposits]);


  const handleAction = (transactionId: string, status: 'Completed' | 'Failed') => {
    if (updateTransactionStatus(transactionId, status)) {
        const action = status === 'Completed' ? 'approved' : 'rejected';
        toast({
          title: `Deposit ${action}`,
          description: `Transaction ${transactionId} has been ${action}.`,
        })
        setKey(Date.now()); // Re-render the component to reflect changes
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

  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.deposits')}</h1>
        <p className="text-muted-foreground">Review and manage all user deposit requests.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Deposit Requests</CardTitle>
          <CardDescription>A list of all deposits made by users.</CardDescription>
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
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount (USD)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell className="font-medium">{deposit.id}</TableCell>
                  <TableCell>{deposit.userName}</TableCell>
                  <TableCell>{deposit.date}</TableCell>
                  <TableCell className="text-right">{deposit.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(deposit.status)}>
                      {deposit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {deposit.status === 'Pending' ? (
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => handleAction(deposit.id, 'Completed')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleAction(deposit.id, 'Failed')}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No actions</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
               {filteredDeposits.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No deposit requests found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
