
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

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2, PlusCircle, Edit, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore } from "@/firebase/provider"
import { addChatAgent, deleteChatAgent, listenToAllChatAgents, updateChatAgent } from "@/lib/firestore"
import type { ChatAgent } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"

function AgentFormDialog({ agent, onSave }: { agent?: ChatAgent; onSave: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);

    const [email, setEmail] = React.useState(agent?.email || "");
    const [canApproveDeposits, setCanApproveDeposits] = React.useState(agent?.canApproveDeposits || false);
    const [canApproveWithdrawals, setCanApproveWithdrawals] = React.useState(agent?.canApproveWithdrawals || false);

    React.useEffect(() => {
        if (open) {
            setEmail(agent?.email || "");
            setCanApproveDeposits(agent?.canApproveDeposits || false);
            setCanApproveWithdrawals(agent?.canApproveWithdrawals || false);
        }
    }, [open, agent]);

    const handleSaveAgent = async () => {
        if (!firestore || !email) {
            toast({ variant: "destructive", title: "Email is required" });
            return;
        }

        try {
            if (agent) {
                await updateChatAgent(firestore, agent.id!, {
                    email,
                    canApproveDeposits,
                    canApproveWithdrawals,
                });
                toast({ title: "Chat Agent Updated", description: `${email} permissions have been updated.` });

            } else {
                await addChatAgent(firestore, {
                    email,
                    canApproveDeposits,
                    canApproveWithdrawals,
                    isActive: false
                });
                toast({ title: "Chat Agent Added", description: `${email} can now log in to the chat panel.` });
            }
            onSave(); // To refresh the list or perform other actions
            setOpen(false); // Close the dialog on success
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to save agent", description: error.message });
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {agent ? (
                     <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4 text-blue-600"/>
                    </Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Agent
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{agent ? "Edit Chat Agent" : "Add New Chat Agent"}</DialogTitle>
                    <DialogDescription>
                        {agent ? "Update the agent's permissions." : "Enter the agent's email and set their permissions."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="agent-email">Agent Email</Label>
                        <Input 
                            id="agent-email" 
                            type="email" 
                            placeholder="agent@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!!agent} // Don't allow editing email
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>Permissions</Label>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="deposit-access" checked={canApproveDeposits} onCheckedChange={(checked) => setCanApproveDeposits(Boolean(checked))} />
                            <Label htmlFor="deposit-access" className="text-sm font-normal">
                                Can handle deposit queries
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="withdrawal-access" checked={canApproveWithdrawals} onCheckedChange={(checked) => setCanApproveWithdrawals(Boolean(checked))} />
                            <Label htmlFor="withdrawal-access" className="text-sm font-normal">
                                Can handle withdrawal queries
                            </Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSaveAgent}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminAgentsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [agents, setAgents] = React.useState<ChatAgent[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    const refreshAgents = () => {
        if (!firestore) return;
        setLoading(true);
        const unsubscribe = listenToAllChatAgents(firestore, (fetchedAgents) => {
            setAgents(fetchedAgents);
            setLoading(false);
        });
        return unsubscribe;
    }

    React.useEffect(() => {
        const unsubscribe = refreshAgents();
        return () => unsubscribe && unsubscribe();
    }, [firestore]);
    
    const handleDeleteAgent = async (agentId: string) => {
        if (!firestore) return;
        try {
            await deleteChatAgent(firestore, agentId);
            toast({ variant: "destructive", title: "Chat Agent Removed" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to remove agent", description: error.message });
        }
    }

    return (
         <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chat Agent Management</h1>
                    <p className="text-muted-foreground">Add, remove, and manage support agents and their performance.</p>
                </div>
                <AgentFormDialog onSave={refreshAgents} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Existing Agents</CardTitle>
                    <CardDescription>A list of all current support agents and their performance statistics.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Agent Details</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead>Performance Stats</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : agents.length > 0 ? (
                                agents.map((agent) => (
                                    <TableRow key={agent.id}>
                                        <TableCell className="font-medium">{agent.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                            {agent.canApproveDeposits && <Badge variant="secondary">Deposits</Badge>}
                                            {agent.canApproveWithdrawals && <Badge variant="secondary">Withdrawals</Badge>}
                                            {!agent.canApproveDeposits && !agent.canApproveWithdrawals && <Badge variant="outline">No Permissions</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                <div className="flex items-center gap-1.5 text-green-600">
                                                    <CheckCircle className="h-4 w-4"/> 
                                                    <span>Deposits Approved: <strong>{agent.depositsApproved || 0}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-red-600">
                                                    <XCircle className="h-4 w-4"/>
                                                    <span>Deposits Rejected: <strong>{agent.depositsRejected || 0}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-green-600">
                                                    <CheckCircle className="h-4 w-4"/>
                                                    <span>Withdrawals Approved: <strong>{agent.withdrawalsApproved || 0}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-red-600">
                                                    <XCircle className="h-4 w-4"/>
                                                    <span>Withdrawals Rejected: <strong>{agent.withdrawalsRejected || 0}</strong></span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end">
                                                <AgentFormDialog agent={agent} onSave={refreshAgents} />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the chat agent <span className="font-medium">{agent.email}</span>. They will lose all access.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAgent(agent.id!)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No chat agents added yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
