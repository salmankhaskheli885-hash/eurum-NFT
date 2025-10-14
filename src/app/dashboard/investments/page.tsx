
"use client"

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

import { useToast } from "@/hooks/use-toast"
import type { InvestmentPlan } from "@/lib/data"
import { useTranslation } from "@/hooks/use-translation"
import { Lock, Info } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFirestore } from "@/firebase/provider"
import { listenToAllInvestmentPlans, addTransaction } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"


function InvestmentConfirmationDialog({ plan, onConfirm }: { plan: InvestmentPlan, onConfirm: (plan: InvestmentPlan, amount: number) => void }) {
    const { t } = useTranslation()
    const [amount, setAmount] = React.useState(plan.minInvestment);

    const formatCurrency = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

    const totalProfit = amount * (plan.dailyReturn / 100) * plan.durationDays;
    const totalIncome = amount + totalProfit;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    {t('investments.invest')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('investments.confirmTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('investments.confirmDescription', { planName: plan.name })}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('investments.planName')}</span>
                        <span className="font-semibold">{plan.name}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('investments.dailyReturn')}</span>
                        <span className="font-semibold text-primary">{plan.dailyReturn}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('investments.duration')}</span>
                        <span className="font-semibold">{plan.durationDays} {t('investments.days')}</span>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="amount">{t('investments.investmentAmount')}</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(Number(e.target.value))}
                            min={plan.minInvestment}
                        />
                        <p className="text-xs text-muted-foreground">Min Investment: {formatCurrency(plan.minInvestment)}</p>
                    </div>
                    <hr/>
                    <div className="flex justify-between font-bold">
                        <span>Total Profit</span>
                        <span className="text-green-600">{formatCurrency(totalProfit)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Total Income (P+I)</span>
                        <span className="text-primary">{formatCurrency(totalIncome)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('investments.cancel')}</Button>
                    </DialogClose>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="submit" disabled={amount < plan.minInvestment}>
                                {t('investments.confirmButton')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will deduct {formatCurrency(amount)} from your balance and start the "{plan.name}" plan. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <DialogClose asChild>
                                <AlertDialogAction onClick={() => onConfirm(plan, amount)}>
                                    Proceed
                                </AlertDialogAction>
                               </DialogClose>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function InvestmentsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [plans, setPlans] = React.useState<InvestmentPlan[]>([]);
  const [plansLoading, setPlansLoading] = React.useState(true);


  React.useEffect(() => {
    if (!firestore) return;
    setPlansLoading(true);
    const unsubscribe = listenToAllInvestmentPlans(firestore, (fetchedPlans) => {
        setPlans(fetchedPlans);
        setPlansLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);


  const handleInvest = async (plan: InvestmentPlan, amount: number) => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Not Logged In" });
        return;
    }
    if (user.balance < amount) {
        toast({
            variant: "destructive",
            title: "Insufficient Balance",
            description: `You need at least $${amount} to invest. Your current balance is $${user.balance.toFixed(2)}.`,
        });
        return;
    }
    if (amount < plan.minInvestment) {
        toast({
            variant: "destructive",
            title: "Invalid Amount",
            description: `Minimum investment for this plan is $${plan.minInvestment}.`,
        });
        return;
    }

    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + plan.durationDays);

    try {
        await addTransaction(firestore, {
            userId: user.uid,
            userName: user.displayName || 'Unknown',
            type: 'Investment',
            amount: -amount,
            status: 'Completed',
            details: `Investment in ${plan.name}`,
            investmentDetails: {
                planId: plan.id,
                planName: plan.name,
                investedAmount: amount,
                dailyReturn: plan.dailyReturn,
                durationDays: plan.durationDays,
                maturityDate: maturityDate.toISOString(),
                isMatured: false,
            }
        });

        toast({
        title: t('investments.successTitle'),
        description: t('investments.successDescription', { planName: plan.name }),
        });

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Investment Failed",
            description: error.message || "Could not process your investment.",
        });
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  }
  
  const calculateTotalIncome = (plan: InvestmentPlan) => {
      const profit = plan.minInvestment * (plan.dailyReturn / 100) * plan.durationDays;
      return plan.minInvestment + profit;
  }

  const isLoading = userLoading || plansLoading;

  if (isLoading) {
      return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('investments.title')}</h1>
                <p className="text-muted-foreground">{t('investments.description')}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="flex flex-col">
                        <CardHeader>
                            <Skeleton className="h-40 w-full mb-4 rounded-t-lg"/>
                            <Skeleton className="h-7 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-1" />
                        </CardHeader>
                        <CardContent className="flex-grow grid gap-4">
                            <Skeleton className="h-5 w-full"/>
                            <Skeleton className="h-5 w-full"/>
                            <Skeleton className="h-5 w-full"/>
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-full"/>
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
        <h1 className="text-3xl font-bold tracking-tight">{t('investments.title')}</h1>
        <p className="text-muted-foreground">{t('investments.description')}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isLocked = (user?.vipLevel ?? 1) < plan.requiredVipLevel
          return (
            <Card key={plan.id} className={`flex flex-col ${isLocked ? 'bg-muted/50 border-dashed' : ''}`}>
              <CardHeader>
                <div className="relative h-40 w-full mb-4">
                    <Image 
                        src={plan.imageUrl} 
                        alt={plan.name}
                        fill
                        className="rounded-t-lg object-cover"
                        data-ai-hint="investment product"
                     />
                </div>
                <div className="flex justify-between items-start">
                  <CardTitle>{plan.name}</CardTitle>
                  {isLocked && <Lock className="text-muted-foreground" />}
                </div>
                <CardDescription>
                  {t('investments.requiredVip', { level: plan.requiredVipLevel })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('investments.dailyReturn')}</span>
                  <span className="font-semibold text-primary">{plan.dailyReturn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('investments.duration')}</span>
                  <span className="font-semibold">{plan.durationDays} {t('investments.days')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Income (at min)</span>
                  <span className="font-semibold">
                    {formatCurrency(calculateTotalIncome(plan))}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                {isLocked ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Lock className="mr-2 h-4 w-4" />
                    {t('investments.locked')}
                  </Button>
                ) : (
                  <InvestmentConfirmationDialog plan={plan} onConfirm={handleInvest} />
                )}
              </CardFooter>
            </Card>
          )
        })}
        {!plansLoading && plans.length === 0 && (
            <Card className="md:col-span-3 text-center">
                <CardHeader>
                    <CardTitle>No Plans Available</CardTitle>
                    <CardDescription>The administrator has not added any investment plans yet. Please check back later.</CardDescription>
                </CardHeader>
            </Card>
        )}
      </div>
    </div>
  )
}
