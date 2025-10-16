
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, User, Handshake, MessageSquare } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"

export default function SelectPanelPage() {
    const { user, loading } = useUser();
    const navigate = useNavigate();

    // Redirect non-admins away from this page
    if (!loading && user?.role !== 'admin') {
        navigate('/dashboard');
        return (
             <div className="flex min-h-screen flex-col items-center justify-center">
                <p>Redirecting...</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                 <Card className="w-full max-w-lg">
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Select a Panel</CardTitle>
                    <CardDescription>
                        You are logged in as an Admin. Choose which panel you want to access.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Link to="/admin">
                        <Button className="w-full h-14 text-lg justify-between" size="lg">
                            Go to Admin Panel
                            <Shield className="h-6 w-6" />
                        </Button>
                    </Link>
                     <Link to="/dashboard" target="_blank">
                        <Button variant="outline" className="w-full h-12 justify-between">
                            View User Panel
                            <User className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link to="/partner" target="_blank">
                        <Button variant="outline" className="w-full h-12 justify-between">
                           View Partner Panel
                            <Handshake className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link to="/agent" target="_blank">
                        <Button variant="outline" className="w-full h-12 justify-between">
                           View Agent Panel
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
