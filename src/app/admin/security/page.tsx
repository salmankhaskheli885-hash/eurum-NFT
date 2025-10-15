
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { ShieldAlert, UserCog, UserPlus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore } from "@/firebase/provider"
import { addChatAgent, deleteChatAgent, listenToAllChatAgents } from "@/lib/firestore"
import type { ChatAgent } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// Sample data for demonstration
const securityLogs = [
  // Start with empty logs
];

function ChatAgentManager() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [agents, setAgents] = React.useState<ChatAgent[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [newAgentEmail, setNewAgentEmail] = React.useState("");
    const [canApproveDeposits, setCanApproveDeposits] = React.useState(false);
    const [canApproveWithdrawals, setCanApproveWithdrawals] = React.useState(false);

    React.useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const unsubscribe = listenToAllChatAgents(firestore, (fetchedAgents) => {
            setAgents(fetchedAgents);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleAddAgent = async () => {
        if (!firestore || !newAgentEmail) {
            toast({ variant: "destructive", title: "Email is required" });
            return;
        }

        try {
            await addChatAgent(firestore, {
                email: newAgentEmail,
                canApproveDeposits,
                canApproveWithdrawals,
            });
            toast({ title: "Chat Agent Added", description: `${newAgentEmail} can now log in to the chat panel.` });
            setNewAgentEmail("");
            setCanApproveDeposits(false);
            setCanApproveWithdrawals(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to add agent", description: error.message });
        }
    };
    
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
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Chat Agent Management</CardTitle>
            <UserPlus className="w-6 h-6 text-primary"/>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Add New Chat Agent</h4>
                 <div className="space-y-2">
                    <Label htmlFor="agent-email">Agent Email</Label>
                    <Input 
                        id="agent-email" 
                        type="email" 
                        placeholder="agent@example.com"
                        value={newAgentEmail}
                        onChange={(e) => setNewAgentEmail(e.target.value)}
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
                 <Button onClick={handleAddAgent}>Add Agent</Button>
            </div>

            <div className="space-y-2">
                <h4 className="font-medium">Existing Agents</h4>
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             [...Array(2)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : agents.length > 0 ? (
                            agents.map((agent) => (
                                <TableRow key={agent.id}>
                                    <TableCell className="font-medium">{agent.email}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                        {agent.canApproveDeposits && <Badge variant="secondary">Deposits</Badge>}
                                        {agent.canApproveWithdrawals && <Badge variant="secondary">Withdrawals</Badge>}
                                        {!agent.canApproveDeposits && !agent.canApproveWithdrawals && <Badge variant="outline">No Permissions</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
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
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">No chat agents added yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
    )
}

export default function AdminSecurityPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [is2faEnabled, setIs2faEnabled] = React.useState(false)

  const handleToggle2fa = (enabled: boolean) => {
    setIs2faEnabled(enabled)
    toast({
      title: "Security Setting Updated",
      description: `Two-Factor Authentication has been ${enabled ? 'Enabled' : 'Disabled'} for all admin accounts. (This is a demo)`,
    })
  }

  const handleConfigureIpWhitelist = () => {
    toast({
      title: "Feature Not Implemented",
      description: "IP Whitelisting configuration is a placeholder for now.",
    })
  }
  
  const handleManageRoles = () => {
    toast({
      title: "Feature Not Implemented",
      description: "Detailed role management is a placeholder for now.",
    })
  }

  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.security')}</h1>
        <p className="text-muted-foreground">Monitor and manage application security.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Security Settings</CardTitle>
                <ShieldAlert className="w-6 h-6 text-primary"/>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-medium">Two-Factor Authentication (2FA)</h4>
                        <p className="text-sm text-muted-foreground">Enforce 2FA for all admin accounts.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="2fa-switch"
                            checked={is2faEnabled}
                            onCheckedChange={handleToggle2fa}
                        />
                        <Label htmlFor="2fa-switch" className="text-sm">{is2faEnabled ? 'Enabled' : 'Disabled'}</Label>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-medium">IP Whitelisting</h4>
                        <p className="text-sm text-muted-foreground">Restrict admin access to specific IP addresses.</p>
                    </div>
                    <Button variant="outline" onClick={handleConfigureIpWhitelist}>Configure</Button>
                </div>
            </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Security Logs</CardTitle>
                    <CardDescription>Recent security-related events in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {securityLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No security logs found.</TableCell>
                            </TableRow>
                        ) : (
                            securityLogs.map((log: any) => (
                                <TableRow key={log.id} className={log.event.includes('Suspicious') ? 'bg-destructive/10 text-destructive' : ''}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    {log.event.includes('Suspicious') && <ShieldAlert className="w-4 h-4"/>}
                                    {log.event}
                                </TableCell>
                                <TableCell>{log.user}</TableCell>
                                <TableCell>{log.ip}</TableCell>
                                <TableCell>{log.timestamp}</TableCell>
                                </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <ChatAgentManager />
            <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Admin Roles</CardTitle>
                <UserCog className="w-6 h-6 text-primary"/>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-medium">Super Admin</h4>
                        <p className="text-sm text-muted-foreground">Full access to all settings.</p>
                    </div>
                    <Badge>Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-medium">Support Staff</h4>
                        <p className="text-sm text-muted-foreground">Limited access for user support.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleManageRoles}>Manage</Button>
                </div>
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
