
"use client"

import * as React from "react"
import { useFirestore } from "@/firebase/provider"
import type { Transaction } from "@/lib/data"
import { listenToAllTransactions, updateTransactionStatus } from "@/lib/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Eye, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function DepositHistory({ agentId }: { agentId: string }) {
    const firestore = useFirestore();
    const [history, setHistory] = React.useState<Transaction[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");

    React.useEffect(() => {
        if (!firestore || !agentId) return;
        setLoading(true);
        const unsubscribe = listenToAllTransactions(firestore, (allTransactions) => {
            setHistory(
                allTransactions.filter(tx => 
                    tx.type === 'Deposit' && 
                    tx.status !== 'Pending' &&
                    tx.assignedAgentId === agentId
                ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            );
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore, agentId]);

    const filteredHistory = React.useMemo(() => {
        if (!searchTerm) return history;
        const lowercasedFilter = searchTerm.toLowerCase();
        return history.filter(item =>
            item.id.toLowerCase().includes(lowercasedFilter) ||
            item.userName.toLowerCase().includes(lowercasedFilter) ||
            item.status.toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, history]);

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
                <CardTitle>Deposit History</CardTitle>
                <CardDescription>A list of all deposit requests you have processed.</CardDescription>
                <div className="relative pt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search history..."
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
                            <TableHead className="text-right">Amount (PKR)</TableHead>
                            <TableHead className="text-center">Final Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredHistory.length > 0 ? (
                            filteredHistory.map((deposit) => (
                                <TableRow key={deposit.id}>
                                    <TableCell className="font-medium">{deposit.id}</TableCell>
                                    <TableCell>{deposit.userName}</TableCell>
                                    <TableCell>{new Date(deposit.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">{deposit.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getStatusVariant(deposit.status)}>
                                            {deposit.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">You have not processed any deposits yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function AgentDepositsPage() {
    const firestore = useFirestore()
    const { toast } = useToast()
    const { user: agentProfile } = useUser()

    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const hasPermission = agentProfile?.canApproveDeposits;

    React.useEffect(() => {
        if (!firestore || !hasPermission || !agentProfile) {
            setLoading(false)
            return;
        }
        setLoading(true);
        const unsubscribe = listenToAllTransactions(firestore, (allTransactions) => {
            // Pending requests for this agent
            setTransactions(allTransactions.filter(tx => 
                tx.type === 'Deposit' && 
                tx.status === 'Pending' &&
                tx.assignedAgentId === agentProfile.uid
            ));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore, hasPermission, agentProfile]);

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

    const filteredDeposits = React.useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return transactions.filter(tx => 
            tx.userName.toLowerCase().includes(lowercasedFilter) ||
            tx.id.toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, transactions]);

    if (!agentProfile) {
        return <Skeleton className="h-96 w-full"/>
    }

    if (!hasPermission) {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You do not have permission to manage deposits.</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Deposits</h1>
                <p className="text-muted-foreground">Review and approve user deposits.</p>
            </div>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                     <Card>
                        <CardHeader>
                        <CardTitle>Your Pending Deposit Requests</CardTitle>
                        <CardDescription>A list of all deposits awaiting your approval.</CardDescription>
                        <div className="relative pt-2">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            type="search"
                            placeholder="Search by user or transaction ID..."
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
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount (PKR)</TableHead>
                                <TableHead className="text-center">Receipt</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
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
                                        <TableCell>{new Date(deposit.date).toLocaleDateString()}</TableCell>
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
                                    <TableCell colSpan={5} className="h-24 text-center">No pending deposit requests assigned to you.</TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                   {agentProfile && <DepositHistory agentId={agentProfile.uid} />}
                </TabsContent>
            </Tabs>
        </div>
    )
}
