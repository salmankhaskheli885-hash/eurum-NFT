
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { MoreHorizontal, PlusCircle, Search } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { mockInvestmentPlans, type InvestmentPlan } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// Component for Add/Edit Plan Dialog
function PlanForm({ plan, onSave, children }: { plan?: InvestmentPlan | null, onSave: (plan: InvestmentPlan) => void, children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    const [formData, setFormData] = React.useState<Omit<InvestmentPlan, 'id'>>(
        plan 
        ? { ...plan } 
        : { name: '', dailyReturn: 0, durationDays: 0, minInvestment: 0, maxInvestment: 0, requiredVipLevel: 1 }
    );

    React.useEffect(() => {
        if (open && plan) {
            setFormData({ ...plan });
        } else if (open && !plan) {
            setFormData({ name: '', dailyReturn: 0, durationDays: 0, minInvestment: 0, maxInvestment: 0, requiredVipLevel: 1 });
        }
    }, [open, plan]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = () => {
        const newPlan = { ...formData, id: plan?.id ?? Date.now() };
        onSave(newPlan);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{plan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
                    <DialogDescription>
                        {plan ? 'Make changes to the investment plan.' : 'Create a new investment plan for users.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dailyReturn" className="text-right">Daily Return (%)</Label>
                        <Input id="dailyReturn" name="dailyReturn" type="number" value={formData.dailyReturn} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="durationDays" className="text-right">Duration (Days)</Label>
                        <Input id="durationDays" name="durationDays" type="number" value={formData.durationDays} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minInvestment" className="text-right">Min Investment</Label>
                        <Input id="minInvestment" name="minInvestment" type="number" value={formData.minInvestment} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxInvestment" className="text-right">Max Investment</Label>
                        <Input id="maxInvestment" name="maxInvestment" type="number" value={formData.maxInvestment} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="requiredVipLevel" className="text-right">Required VIP</Label>
                        <Input id="requiredVipLevel" name="requiredVipLevel" type="number" value={formData.requiredVipLevel} onChange={handleChange} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function AdminInvestmentsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [plans, setPlans] = React.useState<InvestmentPlan[]>(mockInvestmentPlans)
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const filteredPlans = React.useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) return plans;
    return plans.filter(plan => 
      plan.name.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm, plans]);

  const handleSavePlan = (planToSave: InvestmentPlan) => {
    const isEditing = plans.some(p => p.id === planToSave.id);
    if (isEditing) {
        setPlans(plans.map(p => p.id === planToSave.id ? planToSave : p));
        toast({
            title: "Plan Updated",
            description: `The plan "${planToSave.name}" has been updated.`,
        });
    } else {
        const newPlan = { ...planToSave, id: Date.now() }; // Ensure unique ID for new plans
        setPlans([...plans, newPlan]);
         toast({
            title: "New Plan Added",
            description: `The plan "${newPlan.name}" has been created.`,
        });
    }
  }

  const handleDeletePlan = (planId: number) => {
    const planName = plans.find(p => p.id === planId)?.name || '';
    setPlans(plans.filter(p => p.id !== planId));
    toast({
        variant: "destructive",
        title: `Plan Deleted`,
        description: `The plan "${planName}" has been removed.`,
    });
  }


  return (
    <div className="flex flex-col gap-4">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.investments')}</h1>
                <p className="text-muted-foreground">Manage all investment plans available to users.</p>
            </div>
            <PlanForm onSave={handleSavePlan}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Plan
                </Button>
            </PlanForm>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Investment Plans</CardTitle>
          <CardDescription>A list of all investment plans in the system.</CardDescription>
           <div className="relative pt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by plan name..."
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
              {filteredPlans.map((plan) => (
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
                        <PlanForm plan={plan} onSave={handleSavePlan}>
                           <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left">Edit</button>
                        </PlanForm>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive w-full text-left">Delete</button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the plan "{plan.name}".
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
