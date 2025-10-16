
"use client"

import * as React from "react"
import { Link } from "react-router-dom"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Eye } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { listenToAllUsers, updateUser as updateUserInDb, deleteUser as deleteUserInDb } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const firestore = useFirestore()
  
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToAllUsers(firestore, (fetchedUsers) => {
        setUsers(fetchedUsers);
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
        item.email?.toLowerCase().includes(lowercasedFilter) ||
        item.uid.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [searchTerm, users]);


  const handleStatusChange = async (userId: string, status: User['status']) => {
    if (!firestore) return;
    try {
        await updateUserInDb(firestore, userId, { status });
        toast({ title: `User ${status}`, description: `User status has been updated.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update user status."})
    }
  }

  const handleRoleChange = async (userId: string, role: User['role']) => {
    if (!firestore) return;
    try {
        await updateUserInDb(firestore, userId, { role });
        toast({ title: `Role Updated`, description: `User role has been set to ${role}.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update user role."})
    }
  }

  const handleDelete = async (userId: string) => {
    if (!firestore) return;
    try {
        await deleteUserInDb(firestore, userId);
        toast({ variant: "destructive", title: "User Deleted", description: "The user has been permanently removed." });
    } catch (error) {
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the user."})
    }
  }

  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.users')}</h1>
        <p className="text-muted-foreground">Manage all registered users and partners.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
           <div className="relative pt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, or ID..."
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.displayName || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.role === 'partner' ? 'secondary' : (user.role === 'admin' ? 'outline' : 'default') }>
                            {user.role}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                        {user.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{"-not tracked-"}</TableCell>
                    <TableCell>
                        <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link to={`/admin/users/${user.uid}`} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4"/>
                                    Details
                                </Link>
                            </Button>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                    <Link to={`/dashboard?userId=${user.uid}`} target="_blank">View as User</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Edit Role</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'user')}>Set as User</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'partner')}>Set as Partner</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'admin')}>Set as Admin</DropdownMenuItem>
                                </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                {user.status === 'Active' ? (
                                    <DropdownMenuItem onClick={() => handleStatusChange(user.uid, 'Suspended')}>Suspend</DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => handleStatusChange(user.uid, 'Active')}>Activate</DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive w-full text-left">Delete</button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the user account.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(user.uid)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
