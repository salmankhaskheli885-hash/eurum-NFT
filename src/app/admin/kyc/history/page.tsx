
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
import { type User } from "@/lib/data"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore } from "@/firebase/provider"
import { listenToAllUsers } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminKycHistoryPage() {
  const firestore = useFirestore()
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  React.useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToAllUsers(firestore, (allUsers) => {
        // Only show processed KYC
        setUsers(allUsers.filter(u => u.kycStatus === 'approved' || u.kycStatus === 'rejected'));
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm) return users;
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(item => {
      return (
        item.displayName?.toLowerCase().includes(lowercasedFilter) ||
        item.email?.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [searchTerm, users]);


  const getStatusVariant = (status: User['kycStatus']) => {
    switch (status) {
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle>User KYC History</CardTitle>
          <CardDescription>A list of all processed (Approved/Rejected) KYC submissions.</CardDescription>
           <div className="relative pt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by user name or email..."
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
                <TableHead className="text-center">Final Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                    </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant={getStatusVariant(user.kycStatus)}>
                        {user.kycStatus}
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">No processed user KYC submissions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  )
}
