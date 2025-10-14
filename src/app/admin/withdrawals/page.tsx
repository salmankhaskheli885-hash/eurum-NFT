
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

export default function AdminWithdrawalsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [key, setKey] = React.useState(Date.now())

  const withdrawals = React.useMemo(() => mockTransactions.filter(tx => tx.type === 'Withdrawal'), [key]);
  const [filteredWithdrawals, setFilteredWithdrawals] = React.useState(withdrawals)
  
  React.useEffect(() => {
    setFilteredWithdrawals(withdrawals);
  }, [withdrawals]);

  React.useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = withdrawals.filter(item => {
      return (
        item.id.toLowerCase().includes(lowercasedFilter) ||
        item.userName.toLowerCase().includes(lowercasedFilter) ||
        item.status.toLowerCase().includes(lowercasedFilter) ||
        item.userId.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredWithdrawals(filteredData);
  }, [searchTerm, withdrawals]);

  const handleAction = (transactionId: string, status: 'Completed' | 'Failed') => {
    if (updateTransactionStatus(transactionId, status)) {
        const action = status === 'Completed' ? 'approved' : 'rejected';
        toast({
          title: `Withdrawal ${action}`,
          description: `Transaction ${transactionId} has been ${action}.`,
        })
        setKey(Date.now());
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
              {filteredWithdrawals.map((withdrawal) => (
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
                        </div>
                      )}
                  </TableCell>
                  <TableCell>{withdrawal.date}</TableCell>
                  <TableCell className="text-right text-destructive">
                    {Math.abs(withdrawal.amount).toLocaleString()}
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
              ))}
               {filteredWithdrawals.length === 0 && (
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

    