
"use client"
import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useFirestore } from "@/firebase/provider"
import { listenToUser, updateUser, listenToUserTransactions } from "@/lib/firestore"
import type { User, Transaction } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default function AdminUserDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const firestore = useFirestore()
    const { toast } = useToast()

    const userId = params.userId as string

    const [user, setUser] = React.useState<User | null>(null)
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [loading, setLoading] = React.useState(true)
    
    // For editing
    const [editableUser, setEditableUser] = React.useState<Partial<User>>({})

    React.useEffect(() => {
        if (!firestore || !userId) return;
        setLoading(true)
        const unsubscribeUser = listenToUser(firestore, userId, (userData) => {
            setUser(userData)
            setEditableUser(userData || {})
            setLoading(false)
        })

        const unsubscribeTransactions = listenToUserTransactions(firestore, userId, (userTransactions) => {
            setTransactions(userTransactions)
        })

        return () => {
            unsubscribeUser()
            unsubscribeTransactions()
        }
    }, [firestore, userId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        const isNumber = type === 'number';
        setEditableUser(prev => ({...prev, [id]: isNumber ? Number(value) : value }))
    }
    
    const handleSelectChange = (id: string, value: string) => {
        setEditableUser(prev => ({...prev, [id]: value }))
    }
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    }

    const handleSaveChanges = async () => {
        if (!firestore || !userId) return;
        try {
            // Remove uid from the object to prevent trying to edit it
            const { uid, ...updates } = editableUser
            await updateUser(firestore, userId, updates)
            toast({
                title: "User Updated",
                description: `${user?.displayName}'s profile has been saved.`,
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not save user profile.",
            })
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

    const getInvestmentPlans = () => {
        return transactions.filter(tx => tx.type === 'Investment')
    }

    if (loading) {
        return (
             <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <Skeleton className="h-7 w-1/2"/>
                            <Skeleton className="h-4 w-3/4 mt-1"/>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-1/4"/>
                                    <Skeleton className="h-10 w-full"/>
                                </div>
                            ))}
                             <Skeleton className="h-10 w-full mt-4"/>
                        </CardContent>
                    </Card>
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                             <CardHeader><Skeleton className="h-7 w-1/3"/></CardHeader>
                             <CardContent><Skeleton className="h-24 w-full"/></CardContent>
                        </Card>
                         <Card>
                             <CardHeader><Skeleton className="h-7 w-1/3"/></CardHeader>
                             <CardContent><Skeleton className="h-48 w-full"/></CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <div>User not found. <Button onClick={() => router.back()}>Go Back</Button></div>
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <Card className="lg:col-span-1 sticky top-4">
                    <CardHeader>
                        <CardTitle>{user.displayName}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input id="displayName" value={editableUser.displayName || ''} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="balance">Balance</Label>
                            <Input id="balance" type="number" value={editableUser.balance ?? ''} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="vipLevel">VIP Level</Label>
                            <Input id="vipLevel" type="number" value={editableUser.vipLevel ?? ''} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={editableUser.role} onValueChange={(value) => handleSelectChange('role', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="partner">Partner</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                             <Select value={editableUser.status} onValueChange={(value) => handleSelectChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSaveChanges} className="w-full">Save Changes</Button>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Investment Plans</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plan Name</TableHead>
                                        <TableHead>Invested</TableHead>
                                        <TableHead>Maturity</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getInvestmentPlans().length > 0 ? getInvestmentPlans().map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{tx.investmentDetails?.planName}</TableCell>
                                            <TableCell>PKR {Math.abs(tx.amount).toLocaleString()}</TableCell>
                                            <TableCell>{formatDate(tx.investmentDetails!.maturityDate)}</TableCell>
                                            <TableCell>
                                                <Badge variant={new Date(tx.investmentDetails!.maturityDate) < new Date() ? 'default' : 'secondary'}>
                                                    {new Date(tx.investmentDetails!.maturityDate) < new Date() ? 'Matured' : 'Active'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No active investments.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>All Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? transactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-xs">{tx.id.substring(0, 8)}...</TableCell>
                                            <TableCell>{tx.type}</TableCell>
                                            <TableCell className={`${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>PKR {tx.amount.toLocaleString()}</TableCell>
                                            <TableCell>{formatDate(tx.date)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">No transactions found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

    