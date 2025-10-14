
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
import { MoreHorizontal, Search } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { Input } from "@/components/ui/input"
import { mockUsers, updateUser, deleteUser, type User } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [key, setKey] = React.useState(Date.now())
  const [searchTerm, setSearchTerm] = React.useState("")
  
  const users = React.useMemo(() => mockUsers, [key]);
  const [filteredUsers, setFilteredUsers] = React.useState(users)

  React.useEffect(() => {
    setFilteredUsers(users);
  }, [users]);
  
  const forceUpdate = () => setKey(Date.now())

  React.useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = users.filter(item => {
      return (
        item.displayName?.toLowerCase().includes(lowercasedFilter) ||
        item.email?.toLowerCase().includes(lowercasedFilter) ||
        item.uid.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredUsers(filteredData);
  }, [searchTerm, users]);

  const handleStatusChange = (userId: string, status: User['status']) => {
    if (updateUser(userId, { status })) {
        toast({ title: `User ${status}`, description: `User status has been updated.` });
        forceUpdate();
    }
  }

  const handleRoleChange = (userId: string, role: User['role']) => {
    if (updateUser(userId, { role })) {
        toast({ title: `Role Updated`, description: `User role has been set to ${role}.` });
        forceUpdate();
    }
  }

  const handleDelete = (userId: string) => {
    if (deleteUser(userId)) {
        toast({ variant: "destructive", title: "User Deleted", description: "The user has been permanently removed." });
        forceUpdate();
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
              {filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.displayName || "N/A"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                   <TableCell>
                     <Badge variant={user.role === 'Partner' ? 'secondary' : (user.role === 'admin' ? 'outline' : 'default') }>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
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
