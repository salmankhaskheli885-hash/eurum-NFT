
"use client"

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
import { ShieldAlert, UserCog } from "lucide-react"

// Sample data for demonstration
const securityLogs = [
  { id: 1, event: "Failed Login", user: "user@example.com", ip: "192.168.1.10", timestamp: "2023-11-15 10:30:00" },
  { id: 2, event: "Suspicious Withdrawal Attempt", user: "satoshi@fynix.pro", ip: "10.0.0.5", timestamp: "2023-11-15 09:15:00" },
  { id: 3, event: "Password Changed", user: "alice@example.com", ip: "203.0.113.25", timestamp: "2023-11-14 18:00:00" },
];

export default function AdminSecurityPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.security')}</h1>
        <p className="text-muted-foreground">Monitor and manage application security.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Button variant="outline">Enable</Button>
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <h4 className="font-medium">IP Whitelisting</h4>
                    <p className="text-sm text-muted-foreground">Restrict admin access to specific IP addresses.</p>
                </div>
                <Button variant="outline">Configure</Button>
            </div>
          </CardContent>
        </Card>
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
                 <Button variant="outline" size="sm">Manage</Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {securityLogs.map((log) => (
                <TableRow key={log.id} className={log.event.includes('Suspicious') ? 'bg-destructive/10' : ''}>
                  <TableCell className="font-medium flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-destructive"/>{log.event}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
