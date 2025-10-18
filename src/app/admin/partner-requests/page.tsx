
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
import { useToast } from "@/hooks/use-toast"
import { Search, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore } from "@/firebase/provider"
import { listenToPartnerRequests, updatePartnerRequestStatus } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import type { PartnerRequest } from "@/lib/data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function RequestHistory() {
    const firestore = useFirestore();
    const [requests, setRequests] = React.useState<PartnerRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");

    React.useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const unsubscribe = listenToPartnerRequests(firestore, (allRequests) => {
            setRequests(allRequests.filter(req => req.status !== 'pending'));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    const filteredRequests = React.useMemo(() => {
        if (!searchTerm) return requests;
        const lowercasedFilter = searchTerm.toLowerCase();
        return requests.filter(item =>
            item.userName.toLowerCase().includes(lowercasedFilter) ||
            item.userEmail.toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, requests]);

    const getStatusVariant = (status: PartnerRequest['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>Request History</CardTitle>
                <CardDescription>A list of all processed (Approved/Rejected) partner requests.</CardDescription>
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
                            <TableHead>User Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Request Date</TableHead>
                            <TableHead className="text-center">Final Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredRequests.length > 0 ? (
                            filteredRequests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.userName}</TableCell>
                                    <TableCell>{req.userEmail}</TableCell>
                                    <TableCell>{new Date(req.requestDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getStatusVariant(req.status)}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No processed requests found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function AdminPartnerRequestsPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [requests, setRequests] = React.useState<PartnerRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  React.useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToPartnerRequests(firestore, (allRequests) => {
        setRequests(allRequests.filter(req => req.status === 'pending'));
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const filteredRequests = React.useMemo(() => {
    if (!searchTerm) return requests;
    const lowercasedFilter = searchTerm.toLowerCase();
    return requests.filter(item =>
        item.userName.toLowerCase().includes(lowercasedFilter) ||
        item.userEmail.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm, requests]);

 const handleAction = async (request: PartnerRequest, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    try {
      await updatePartnerRequestStatus(firestore, request.id, status);
      toast({
        title: `Request ${status}`,
        description: `Request from ${request.userName} has been updated.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.message || "Could not update the request.",
      });
    }
  }


  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Partner Requests</h1>
        <p className="text-muted-foreground">Approve or reject requests from users to become partners.</p>
      </div>
        <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                 <Card>
                    <CardHeader>
                        <CardTitle>Pending Partner Requests</CardTitle>
                        <CardDescription>A list of all users requesting to become a partner.</CardDescription>
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
                                    <TableHead>User Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Request Date</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-8 w-40 mx-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                    <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.userName}</TableCell>
                                    <TableCell>{req.userEmail}</TableCell>
                                    <TableCell>{new Date(req.requestDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex gap-2 justify-center">
                                            <Button variant="outline" size="sm" onClick={() => handleAction(req, 'approved')}>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Approve
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleAction(req, 'rejected')}>
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No pending partner requests found.</TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history">
                <RequestHistory />
            </TabsContent>
        </Tabs>
    </div>
  )
}
