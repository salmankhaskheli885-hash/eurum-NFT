
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { Input } from "@/components/ui/input"

// Sample data - this will be replaced with live Firebase data
const users = [
  {
    id: "usr_1",
    name: "Satoshi Nakamoto",
    email: "satoshi@fynix.pro",
    status: "Active",
    registered: "2023-10-01",
    role: "User",
  },
  {
    id: "usr_2",
    name: "Alice",
    email: "alice@example.com",
    status: "Active",
    registered: "2023-10-05",
    role: "User",
  },
  {
    id: "usr_3",
    name: "Bob",
    email: "bob@example.com",
    status: "Suspended",
    registered: "2023-10-12",
    role: "User",
  },
    {
    id: "usr_4",
    name: "Vitalik Buterin",
    email: "vitalik@fynix.pro",
    status: "Active",
    registered: "2023-09-20",
    role: "Partner",
  },
  {
    id: "usr_5",
    name: "Charlie",
    email: "charlie@example.com",
    status: "Active",
    registered: "2023-11-01",
    role: "User",
  },
]

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filteredUsers, setFilteredUsers] = React.useState(users)

  React.useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = users.filter(item => {
      return (
        item.name.toLowerCase().includes(lowercasedFilter) ||
        item.email.toLowerCase().includes(lowercasedFilter) ||
        item.id.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredUsers(filteredData);
  }, [searchTerm]);

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
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                   <TableCell>
                     <Badge variant={user.role === 'Partner' ? 'secondary' : 'outline'}>
                        {user.role}
                     </Badge>
                   </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.registered}</TableCell>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Suspend</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
