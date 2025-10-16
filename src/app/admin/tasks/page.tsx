
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react"
import type { Task } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore } from "@/firebase/provider"
import { listenToAllTasks, addTask, updateTask, deleteTask } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


function TaskFormDialog({ task, onSave }: { task?: Task; onSave: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);

    const initialFormData = {
        title: '',
        description: '',
        type: 'referral_deposit' as const,
        targetCount: 0,
        minDeposit: 0,
        rewardAmount: 0,
        isActive: true,
    };

    const [formData, setFormData] = React.useState<Omit<Task, 'id'>>(initialFormData);

    React.useEffect(() => {
        if (open) {
            if (task) {
                setFormData({
                    title: task.title,
                    description: task.description,
                    type: task.type,
                    targetCount: task.targetCount,
                    minDeposit: task.minDeposit,
                    rewardAmount: task.rewardAmount,
                    isActive: task.isActive,
                });
            } else {
                setFormData(initialFormData);
            }
        }
    }, [open, task]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, isActive: checked }));
    }

     const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, type: value as 'referral_deposit' }));
    };

    const handleSubmit = async () => {
        if (!firestore) return;

        if (!formData.title || !formData.description || formData.targetCount <= 0 || formData.rewardAmount <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Input",
                description: "Please fill all fields with valid values.",
            });
            return;
        }

        try {
            if (task?.id) {
                await updateTask(firestore, { ...formData, id: task.id });
                toast({ title: "Task Updated", description: `Task "${formData.title}" has been updated.` });
            } else {
                await addTask(firestore, formData);
                toast({ title: "Task Added", description: `Task "${formData.title}" is now available for partners.` });
            }
            onSave();
            setOpen(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Save Failed", description: error.message });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {task ? (
                    <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left">
                        Edit
                    </button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
                    <DialogDescription>
                        {task ? "Update the details for this task." : "Create a new task for partners to complete."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" value={formData.title} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Task Type</Label>
                         <Select value={formData.type} onValueChange={handleSelectChange}>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Select task type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="referral_deposit">Referral Deposit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="targetCount">Target Referrals</Label>
                        <Input id="targetCount" name="targetCount" type="number" value={formData.targetCount} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="minDeposit">Min Deposit (PKR) for Referral to Count</Label>
                        <Input id="minDeposit" name="minDeposit" type="number" value={formData.minDeposit} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="rewardAmount">Reward Amount (PKR)</Label>
                        <Input id="rewardAmount" name="rewardAmount" type="number" value={formData.rewardAmount} onChange={handleChange} />
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
                        <Label htmlFor="isActive">Task is Active</Label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminTasksPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [tasks, setTasks] = React.useState<Task[]>([]);
    const [loading, setLoading] = React.useState(true);

    const refreshTasks = React.useCallback(() => {
        if (!firestore) return;
        setLoading(true);
        const unsubscribe = listenToAllTasks(firestore, (fetchedTasks) => {
            setTasks(fetchedTasks);
            setLoading(false);
        });
        return unsubscribe;
    }, [firestore]);

    React.useEffect(() => {
        const unsubscribe = refreshTasks();
        return () => unsubscribe && unsubscribe();
    }, [refreshTasks]);

    const handleDeleteTask = async (taskId: string) => {
        if (!firestore) return;
        try {
            await deleteTask(firestore, taskId);
            toast({ variant: "destructive", title: "Task Deleted" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        }
    }
    
     const handleToggleStatus = async (task: Task) => {
      if (!firestore) return;
      const newStatus = !task.isActive;
      try {
        await updateTask(firestore, { ...task, isActive: newStatus });
        toast({
            title: "Task Status Updated",
            description: `The task "${task.title}" is now ${newStatus ? 'Active' : 'Inactive'}.`,
        });
      } catch (error) {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the task status.",
          });
      }
  }


    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
                    <p className="text-muted-foreground">Create and manage tasks for partners to earn rewards.</p>
                </div>
                <TaskFormDialog onSave={refreshTasks} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Existing Tasks</CardTitle>
                    <CardDescription>A list of all available tasks for partners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Goal</TableHead>
                                <TableHead className="text-right">Reward</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={task.isActive ? 'default' : 'secondary'}>
                                                {task.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{task.type.replace('_', ' ')}</TableCell>
                                        <TableCell>
                                            {task.targetCount} referrals with min deposit of {task.minDeposit} PKR
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{task.rewardAmount.toLocaleString()} PKR</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <TaskFormDialog task={task} onSave={refreshTasks} />
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(task)}>
                                                        {task.isActive ? 'Deactivate' : 'Activate'}
                                                    </DropdownMenuItem>
                                                     <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                             <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete the task "{task.title}". This action cannot be undone.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteTask(task.id!)}>Delete</AlertDialogAction>
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
                                    <TableCell colSpan={6} className="h-24 text-center">No tasks created yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
