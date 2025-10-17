
"use client"

import * as React from "react"
import Image from "next/image"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Search } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import type { InvestmentPlan } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useFirestore } from "@/firebase/provider"
import { listenToAllInvestmentPlans, addInvestmentPlan, updateInvestmentPlan, deleteInvestmentPlan } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

// Component for Add/Edit Plan Dialog
function PlanForm({ plan, onSave, children }: { plan?: InvestmentPlan | null, onSave: () => void, children: React.ReactNode }) {
    const firestore = useFirestore();
    const [open, setOpen] = React.useState(false);
    const { toast } = useToast()
    
    const initialFormData: Omit<InvestmentPlan, 'id'> = {
        name: '',
        dailyReturn: 0,
        durationDays: 0,
        minInvestment: 0,
        requiredVipLevel: 1,
        imageUrl: '',
        isActive: true,
        visibleToRoles: ['user', 'partner'] // Default visibility
    };

    const [formData, setFormData] = React.useState<Omit<InvestmentPlan, 'id'>>(initialFormData);
    const [imageSeed, setImageSeed] = React.useState(plan ? 'custom' : 'new-plan');

    React.useEffect(() => {
        if (open) {
          if (plan) {
              setFormData({ 
                  name: plan.name, 
                  dailyReturn: plan.dailyReturn, 
                  durationDays: plan.durationDays, 
                  minInvestment: plan.minInvestment, 
                  requiredVipLevel: plan.requiredVipLevel, 
                  imageUrl: plan.imageUrl, 
                  isActive: plan.isActive,
                  visibleToRoles: plan.visibleToRoles || ['user', 'partner'] // Fallback for old plans
              });
              const match = plan.imageUrl.match(/picsum\.photos\/seed\/([^/]+)/);
              setImageSeed(match ? match[1] : 'custom');
          } else {
              setFormData(initialFormData);
              setImageSeed('new-plan');
          }
        }
    }, [open, plan]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleImageSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageSeed(e.target.value);
    }
    
    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, isActive: checked }));
    }

    const handleRoleVisibilityChange = (role: 'user' | 'partner' | 'agent', checked: boolean) => {
        setFormData(prev => {
            const currentRoles = prev.visibleToRoles;
            if (checked) {
                return { ...prev, visibleToRoles: [...currentRoles, role] };
            } else {
                return { ...prev, visibleToRoles: currentRoles.filter(r => r !== role) };
            }
        });
    }

    const handleSubmit = async () => {
        if (!firestore) return;

        if (!formData.name || formData.dailyReturn <= 0 || formData.durationDays <= 0 || formData.minInvestment <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Input",
                description: "Please fill all fields with valid values.",
            });
            return;
        }

        const finalImageUrl = imageSeed.startsWith('http') 
            ? imageSeed 
            : `https://picsum.photos/seed/${encodeURIComponent(imageSeed)}/600/400`;

        const dataToSave = { ...formData, imageUrl: finalImageUrl };

        try {
            if (plan) {
                await updateInvestmentPlan(firestore, { ...dataToSave, id: plan.id });
                toast({
                    title: "Plan Updated",
                    description: `The plan "${formData.name}" has been updated.`,
                });
            } else {
                await addInvestmentPlan(firestore, dataToSave);
                toast({
                    title: "New Plan Added",
                    description: `The plan "${formData.name}" has been created.`,
                });
            }
            onSave();
            setOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: "Could not save the plan to the database.",
            });
        }
    };

    const roleOptions: ('user' | 'partner' | 'agent')[] = ['user', 'partner', 'agent'];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                 <ScrollArea className="max-h-[80vh]">
                    <div className="p-6">
                        <DialogHeader className="pr-6">
                            <DialogTitle>{plan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
                            <DialogDescription>
                                {plan ? 'Make changes to the investment plan.' : 'Create a new investment plan for users.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dailyReturn">Daily Return %</Label>
                                    <Input id="dailyReturn" name="dailyReturn" type="number" value={formData.dailyReturn} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="durationDays">Duration (Days)</Label>
                                    <Input id="durationDays" name="durationDays" type="number" value={formData.durationDays} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minInvestment">Min Investment</Label>
                                    <Input id="minInvestment" name="minInvestment" type="number" value={formData.minInvestment} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="requiredVipLevel">Required VIP</Label>
                                    <Input id="requiredVipLevel" name="requiredVipLevel" type="number" value={formData.requiredVipLevel} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageSeed">Image Topic</Label>
                                <Input id="imageSeed" name="imageSeed" value={imageSeed} onChange={handleImageSeedChange} placeholder="e.g., gold coins, crypto" />
                                <p className="text-xs text-muted-foreground pt-1">Just type a topic for the image, or paste a full URL.</p>
                            </div>
                            <div className="space-y-3 rounded-lg border p-4">
                                <Label>Visibility</Label>
                                <p className="text-sm text-muted-foreground">Who should see this plan?</p>
                                <div className="flex flex-wrap gap-4 pt-2">
                                    {roleOptions.map(role => (
                                        <div key={role} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-${role}`}
                                                checked={formData.visibleToRoles.includes(role)}
                                                onCheckedChange={(checked) => handleRoleVisibilityChange(role, Boolean(checked))}
                                            />
                                            <Label htmlFor={`role-${role}`} className="text-sm font-normal capitalize">
                                                {role}s
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
                                <Label htmlFor="isActive">Plan is Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleSubmit}>Save changes</Button>
                        </DialogFooter>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}


export default function AdminInvestmentsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const firestore = useFirestore()
  const [plans, setPlans] = React.useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const refreshPlans = React.useCallback(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToAllInvestmentPlans(firestore, (fetchedPlans) => {
        setPlans(fetchedPlans);
        setLoading(false);
    });
    return unsubscribe;
  }, [firestore]);

  React.useEffect(() => {
    const unsubscribe = refreshPlans();
    return () => unsubscribe && unsubscribe();
  }, [refreshPlans]);
  
  const filteredPlans = React.useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) return plans;
    return plans.filter(plan => 
      plan.name.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm, plans]);


  const handleDeletePlan = async (planId: string) => {
    if (!firestore) return;
    const planName = plans.find(p => p.id === planId)?.name || '';
    try {
        await deleteInvestmentPlan(firestore, planId);
        toast({
            variant: "destructive",
            title: `Plan Deleted`,
            description: `The plan "${planName}" has been removed.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the plan from the database.",
        });
    }
  }

  const handleToggleStatus = async (plan: InvestmentPlan) => {
      if (!firestore) return;
      const newStatus = !plan.isActive;
      try {
        await updateInvestmentPlan(firestore, { ...plan, isActive: newStatus });
        toast({
            title: "Plan Status Updated",
            description: `The plan "${plan.name}" is now ${newStatus ? 'Active' : 'Locked'}.`,
        });
      } catch (error) {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the plan status.",
          });
      }
  }


  return (
    <div className="flex flex-col gap-4">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.investments')}</h1>
                <p className="text-muted-foreground">Manage all investment plans available to users.</p>
            </div>
            <PlanForm onSave={() => { /* Listener will update UI */ }}>
                <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
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
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visible To</TableHead>
                <TableHead>Daily Return %</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Min Invest</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <Skeleton className="h-10 w-10 rounded-md" />
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                ))
              ) : filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                    <TableCell>
                        <Image 
                            src={plan.imageUrl} 
                            alt={plan.name} 
                            width={40} 
                            height={40} 
                            className="rounded-md object-cover"
                            data-ai-hint="investment product"
                        />
                    </TableCell>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                   <TableCell>
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Locked'}
                      </Badge>
                   </TableCell>
                   <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {(plan.visibleToRoles || []).map(role => (
                                <Badge key={role} variant="outline" className="capitalize">{role}</Badge>
                            ))}
                        </div>
                   </TableCell>
                  <TableCell>{plan.dailyReturn}</TableCell>
                  <TableCell>{plan.durationDays} days</TableCell>
                  <TableCell>{plan.minInvestment.toLocaleString()}</TableCell>
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
                        <PlanForm plan={plan} onSave={() => {}}>
                           <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left">Edit</button>
                        </PlanForm>
                        <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                            {plan.isActive ? 'Lock Plan' : 'Unlock Plan'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
              ))
              ) : (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">No investment plans found. Add one to get started.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

    