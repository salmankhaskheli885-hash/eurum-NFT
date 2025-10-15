
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
import { useTranslation } from "@/hooks/use-translation"
import { ShieldAlert, UserCog } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// Sample data for demonstration
const securityLogs = [
  // Start with empty logs
];


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
