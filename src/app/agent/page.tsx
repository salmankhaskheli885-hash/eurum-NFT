
"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bot } from "lucide-react"

export default function AgentDashboardPage() {

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the support agent panel.</p>
      </div>
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>Under Construction!</AlertTitle>
        <AlertDescription>
          This is the foundational Agent Panel. The chat interface and user list will be integrated in the next phase.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Active User Chats</CardTitle>
            <CardDescription>Select a user to start a conversation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                <p>User chat list will appear here...</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>Chat Window</CardTitle>
            <CardDescription>Conversation with the selected user.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                <p>Chat messages will appear here...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
