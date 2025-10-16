
"use client"
import * as React from "react"
import { useFirestore } from "@/firebase/provider"
import type { User } from "@/lib/data"
import { useToast } from "@/components/ui/use-toast"
import { listenToAllUsers, updateKycStatus } from "@/lib/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Eye, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminKycHistoryPage from "./history/page"

function KycDetailsDialog({ user }: { user: User }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>KYC Details for {user.displayName}</DialogTitle>
                    <DialogDescription>
                        Review the submitted documents for this user.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   <div className="space-y-2">
                     <p className="font-medium">Mobile Number: <span className="text-muted-foreground">{user.mobileNumber || "Not Provided"}</span></p>
                   </div>
                   {/* In a real app, these would be Image components with src from Firebase Storage */}
                   <div className="space-y-2">
                        <Label>CNIC Front</Label>
                        <div className="h-40 w-full rounded-md border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                            {user.cnicFrontUrl ? "Image Placeholder" : "Not Provided"}
                        </div>
                   </div>
                    <div className="space-y-2">
                        <Label>CNIC Back</Label>
                        <div className="h-40 w-full rounded-md border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                            {user.cnicBackUrl ? "Image Placeholder" : "Not Provided"}
                        </div>
                   </div>
                   <div className="space-y-2">
                        <Label>Selfie</Label>
                        <div className="h-40 w-full rounded-md border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                           {user.selfieUrl ? "Image Placeholder" : "Not Provided"}
                        </div>
                   </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminKycPage() {
    const firestore = useFirestore()
    const { toast } = useToast()
    const [users, setUsers] = React.useState<User[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    React.useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const unsubscribe = listenToAllUsers(firestore, (allUsers) => {
            setUsers(allUsers.filter(u => u.kycStatus === 'pending'));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleAction = async (userId: string, status: 'approved' | 'rejected') => {
        if (!firestore) return;
        try {
            await updateKycStatus(firestore, userId, status);
            toast({
                title: `KYC ${status}`,
                description: `User's KYC status has been updated.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Action Failed",
                description: error.message || "Could not update KYC status.",
            });
        }
    }

    const filteredUsers = React.useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return users.filter(user => 
            user.displayName?.toLowerCase().includes(lowercasedFilter) ||
            user.email?.toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, users]);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">KYC Management</h1>
                <p className="text-muted-foreground">Review and approve user identity verification submissions.</p>
            </div>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                     <Card>
                        <CardHeader>
                        <CardTitle>Pending KYC Requests</CardTitle>
                        <CardDescription>A list of all users awaiting KYC verification.</CardDescription>
                        <div className="relative pt-2">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            type="search"
                            placeholder="Search by name or email..."
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
                                <TableHead>Email</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Documents</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-8 w-8 rounded-md mx-auto" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-8 w-40 mx-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.displayName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{user.kycStatus}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <KycDetailsDialog user={user} />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button variant="outline" size="sm" onClick={() => handleAction(user.uid, 'approved')}>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Approve
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleAction(user.uid, 'rejected')}>
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No pending KYC requests found.</TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <AdminKycHistoryPage />
                </TabsContent>
            </Tabs>
        </div>
    )
}
