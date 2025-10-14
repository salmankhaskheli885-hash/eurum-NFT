"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { mockUser } from "@/lib/data"
import { MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockUsers = [
  { id: "user-1", name: "Satoshi Nakamoto", email: "satoshi@fynix.pro", balance: 1337.42, kycStatus: "approved" },
  { id: "user-2", name: "Vitalik Buterin", email: "vitalik@fynix.pro", balance: 582.19, kycStatus: "pending" },
  { id: "user-3", name: "Charles Hoskinson", email: "charles@fynix.pro", balance: 12052.88, kycStatus: "rejected" },
  { id: "user-4", name: "Gavin Wood", email: "gavin@fynix.pro", balance: 88.00, kycStatus: "unsubmitted" },
];

export default function PartnerUsersPage() {
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: mockUser.currency,
    }).format(amount)
  }

  const getStatusVariant = (status: string) => {
      switch (status) {
          case 'approved': return 'default';
          case 'pending': return 'secondary';
          case 'rejected': return 'destructive';
          default: return 'outline';
      }
  }


  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('partner.users.title')}</h1>
        <p className="text-muted-foreground">{t('partner.users.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('partner.users.table.name')}</TableHead>
                <TableHead>{t('partner.users.table.email')}</TableHead>
                <TableHead className="text-right">{t('partner.users.table.balance')}</TableHead>
                <TableHead className="text-center">{t('partner.users.table.kycStatus')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('partner.users.table.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-right">{formatCurrency(user.balance)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(user.kycStatus)}>
                      {t(`kyc.statusPill.${user.kycStatus}`)}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
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
