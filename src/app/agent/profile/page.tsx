
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function AgentProfilePage() {
    const { user: agent, loading } = useUser();
    
    // @ts-ignore
    const permissions = [
        // @ts-ignore
        { label: "Can Handle Deposits", enabled: agent?.canApproveDeposits },
        // @ts-ignore
        { label: "Can Handle Withdrawals", enabled: agent?.canApproveWithdrawals },
    ]

    if (loading) {
        return (
             <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agent Profile</h1>
                </div>
                <Card>
                    <CardHeader className="items-center">
                        <Skeleton className="h-24 w-24 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-48 mt-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!agent) {
        return <div>Could not load agent profile.</div>
    }

    return (
        <div className="flex flex-col gap-8 max-w-2xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Agent Profile</h1>
                <p className="text-muted-foreground">Your support agent details and permissions.</p>
            </div>
            <Card>
                <CardHeader className="items-center">
                    <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-3xl">{agent.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input id="name" value={agent.displayName || ''} readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={agent.email || ''} readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="flex flex-wrap gap-2">
                            {permissions.filter(p => p.enabled).length > 0 ? 
                                permissions.filter(p => p.enabled).map(p => <Badge key={p.label} variant="secondary">{p.label}</Badge>)
                                : <Badge variant="outline">No special permissions</Badge>
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
