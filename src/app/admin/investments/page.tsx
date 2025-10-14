
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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { mockInvestmentPlans, type InvestmentPlan } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"

// In a real app, this would be a form in a dialog/modal
const handleAddPlan = (toast: any) => {
  toast({
    title: "New Plan Added",
    description: "A new investment plan has been created.",
  })
}

const handleEditPlan = (planId: number, toast: any) => {
    toast({
        title: `Editing Plan ${planId}`,
        description: "Opening plan editor...",
    })
}

const handleDeletePlan = (planId: number, toast: any) => {
    toast({
        variant: "destructive",
        title: `Plan ${planId} Deleted`,
        description: "The investment plan has been removed.",
    })
}


export default function AdminInvestmentsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-4">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.investments')}</h1>
                <p className="text-muted-foreground">Manage all investment plans available to users.</p>
            </div>
            <Button onClick={() => handleAddPlan(toast)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Plan
            </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Investment Plans</CardTitle>
          <CardDescription>A list of all investment plans in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Daily Return (%)</TableHead>
                <TableHead>Duration (Days)</TableHead>
                <TableHead>Min Investment</TableHead>
                <TableHead>Max Investment</TableHead>
                <TableHead>Required VIP</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvestmentPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.dailyReturn}</TableCell>
                  <TableCell>{plan.durationDays}</TableCell>
                  <TableCell>{plan.minInvestment.toLocaleString()}</TableCell>
                  <TableCell>{plan.maxInvestment.toLocaleString()}</TableCell>
                  <TableCell>{plan.requiredVipLevel}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditPlan(plan.id, toast)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePlan(plan.id, toast)}>Delete</DropdownMenuItem>
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
