
"use client"
import * as React from "react"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { listenToAllTasks, listenToUserTasks, claimTaskReward } from "@/lib/firestore"
import type { Task, UserTask } from "@/lib/data"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function PartnerTasksPage() {
    const { user, loading: userLoading } = useUser()
    const firestore = useFirestore()
    const { toast } = useToast()

    const [tasks, setTasks] = React.useState<Task[]>([])
    const [userTasks, setUserTasks] = React.useState<UserTask[]>([])
    const [tasksLoading, setTasksLoading] = React.useState(true)

    React.useEffect(() => {
        if (!firestore) return
        setTasksLoading(true)
        const unsubscribeTasks = listenToAllTasks(firestore, (allTasks) => {
            setTasks(allTasks.filter(t => t.isActive))
            setTasksLoading(false)
        })
        return () => unsubscribeTasks()
    }, [firestore])

    React.useEffect(() => {
        if (!firestore || !user) return
        const unsubscribeUserTasks = listenToUserTasks(firestore, user.uid, (currentUserTasks) => {
            setUserTasks(currentUserTasks)
        })
        return () => unsubscribeUserTasks()
    }, [firestore, user])

    const handleClaimReward = async (task: Task, userTask: UserTask) => {
        if (!firestore || !user) return
        try {
            await claimTaskReward(firestore, user.uid, userTask.id, task.rewardAmount)
            toast({
                title: "Reward Claimed!",
                description: `PKR ${task.rewardAmount.toLocaleString()} has been added to your balance.`,
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to Claim Reward",
                description: error.message || "An unexpected error occurred.",
            })
        }
    }

    const isLoading = userLoading || tasksLoading

    if (isLoading) {
        return (
             <div className="flex flex-col gap-4">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                         <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full mt-2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Partner Tasks</h1>
                <p className="text-muted-foreground">Complete tasks to earn extra rewards.</p>
            </div>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => {
                    const userTask = userTasks.find(ut => ut.taskId === task.id)
                    const progress = userTask?.progress || 0
                    const progressPercentage = Math.min(100, (progress / task.targetCount) * 100)
                    const isCompleted = userTask?.isCompleted || false
                    const isClaimed = userTask?.isClaimed || false

                    return (
                        <Card key={task.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{task.title}</CardTitle>
                                    <Badge variant="secondary">PKR {task.rewardAmount.toLocaleString()}</Badge>
                                </div>
                                <CardDescription>{task.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Goal: {task.targetCount} successful referrals with a minimum deposit of PKR {task.minDeposit.toLocaleString()}.
                                    </p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium">Your Progress</p>
                                        <p className="text-sm font-bold">{progress} / {task.targetCount}</p>
                                    </div>
                                    <Progress value={progressPercentage} />
                                </div>
                            </CardContent>
                            <CardFooter>
                                {isClaimed ? (
                                    <Button disabled className="w-full" variant="outline">
                                        <Check className="mr-2 h-4 w-4" />
                                        Reward Claimed
                                    </Button>
                                ) : isCompleted ? (
                                    <Button className="w-full" onClick={() => handleClaimReward(task, userTask!)}>
                                        <Gift className="mr-2 h-4 w-4" />
                                        Claim Reward
                                    </Button>
                                ) : (
                                    <Button disabled className="w-full">
                                        In Progress
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
                 {!tasksLoading && tasks.length === 0 && (
                    <Card className="md:col-span-3 text-center">
                        <CardHeader>
                            <CardTitle>No Tasks Available</CardTitle>
                            <CardDescription>The administrator has not added any tasks yet. Please check back later.</CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </div>
    )
}
