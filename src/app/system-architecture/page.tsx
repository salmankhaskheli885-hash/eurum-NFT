
"use client"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, Cpu, FileCog, ShieldCheck, UserCheck, Bot, Languages, RadioTower, BarChart, Users } from 'lucide-react'

const sections = [
  {
    title: "1. User System (100% Auto)",
    icon: Users,
    features: [
      { name: "Signup/Login", status: "Auto", logic: "Firebase Auth handle karega (Email/Google)" },
      { name: "Profile Creation", status: "Auto", logic: "Firestore me user data save, UID short format" },
      { name: "VIP Level Progress", status: "Auto", logic: "Cloud Function daily deposit sum calculate kare aur level update kare" },
      { name: "Referral Bonus (5%)", status: "Auto", logic: "Jab koi new user deposit kare, referrer UID par 5% auto credit" },
      { name: "Password Reset", status: "Auto", logic: "Firebase Auth ke through" },
      { name: "24h Auto Logout", status: "Auto", logic: "Cloud Function trigger based on last login timestamp" },
    ],
  },
  {
    title: "2. Deposits (Auto + Verify AI)",
    icon: FileCog,
    steps: [
      { name: "User deposit request", type: "Auto", description: "Firestore → “deposits” collection" },
      { name: "AI Transaction Check", type: "Auto", description: "Cloud Function call AI model → detect fake / duplicate payments" },
      { name: "Auto Approve", type: "Auto", description: "Agar AI clean bole → status = “approved”" },
      { name: "Manual Review", type: "Manual", description: "Agar suspicious lage → “pending_admin_review”" },
      { name: "Balance Update", type: "Auto", description: "User wallet me add ho jata hai after approval" },
    ],
  },
  {
    title: "3. Withdraw (Partial Manual)",
    icon: FileCog,
     steps: [
      { name: "User withdraw request", type: "Auto", description: "Firestore “withdraws” collection me entry" },
      { name: "Fee Apply (2%)", type: "Auto", description: "Cloud Function auto deduct" },
      { name: "Admin Approve", type: "Manual", description: "Withdraw manual confirm by admin portal" },
      { name: "Notify User", type: "Auto", description: "Firebase Cloud Messaging se push notification" },
    ],
  },
  {
    title: "4. Investment Plans (100% Auto)",
    icon: BarChart,
    steps: [
        { name: "User buy plan", type: "Auto", description: "Firestore me save (plan_id, amount, start_date, maturity_days)" },
        { name: "Unlock system", type: "Auto", description: "Har VIP level pe 10 new plans unlock" },
        { name: "Daily earning", type: "Auto", description: "Cloud Function har 24h payout calculate kare" },
        { name: "Maturity Payout", type: "Auto", description: "Cloud Function maturity_date pe auto transfer kare" },
        { name: "History Update", type: "Auto", description: "Transaction automatically Firestore me likha jata hai" },
    ]
  },
  {
    title: "5. Transaction History (100% Auto)",
    icon: FileCog,
    description: "Firestore Collections: /deposits, /withdraws, /plans, /transfers. UI page: history_screen.dart. Auto filter: by date, type, and status. Real-time update via StreamBuilder."
  },
  {
    title: "6. Partner System (Semi-Auto)",
    icon: UserCheck,
    features: [
        { name: "Partner Registration", type: "Auto", description: "Firebase Auth + partner flag true" },
        { name: "10 Referrals Rule", type: "Auto", description: "Cloud Function verify referrals count" },
        { name: "Auto Commission", type: "Auto", description: "5% auto transfer per referral deposit" },
        { name: "Team Tracking", type: "Auto", description: "Firestore data tree structure (referrals/{uid})" },
        { name: "Partner Level Badge", type: "Auto", description: "Update based on team size & total deposit" },
        { name: "Manual Edit", type: "Manual", description: "Admin can change partner level manually (rare cases)" },
    ]
  },
  {
    title: "7. Admin Portal (Web – Manual Control)",
    icon: Cpu,
    description: "Manual-Only Tasks (10%): KYC Approve/Reject, Withdraw Approve, Suspend/Ban Users, Edit/Delete Plans, Announcements. Auto Dashboard Data: Total Users, Total Deposit/Withdraw, Live Balance Graphs, Top Partners Leaderboard, Activity Logs. (Admin portal Firebase se direct connect hoga with admin claim verification)."
  },
  {
    title: "8. Security System (Auto)",
    icon: ShieldCheck,
    features: [
        { name: "Login IP Tracking", type: "Auto", description: "Firestore me store + Cloud Function alert if mismatch" },
        { name: "Suspicious Account", type: "Auto", description: "AI detect unusual activity → auto suspend flag" },
        { name: "Data Backup", type: "Auto", description: "Firebase scheduled backup (daily/weekly)" },
        { name: "Secure Logs", type: "Auto", description: "All actions logged in /logs collection" },
    ]
  },
  {
    title: "9. Notifications System (Auto)",
    icon: RadioTower,
    description: "Events triggering FCM push notifications: Deposit Approved (Auto), Withdraw Approved (Auto), New Plan Unlock (Auto), Referral Bonus Received (Auto), KYC Status Update (Auto), Admin Announcement (Manual)."
  },
  {
    title: "10. AI Integrations (Smart Layer)",
    icon: Bot,
    features: [
        { name: "Deposit Verification", use: "Detect fake receipts" },
        { name: "Fraud Detection", use: "Pattern check (multi-account, fake referrals)" },
        { name: "VIP Prediction", use: "Suggest next level or bonus" },
        { name: "Support Chatbot", use: "User query auto-reply" },
        { name: "Auto Decision Log", use: "AI explanation save in Firestore for admin review" },
    ]
  },
  {
    title: "11. Languages & Theme",
    icon: Languages,
    description: "Multi-Language: Auto (easy_localization – English/Urdu). Theme Switch: Auto (Light/Dark). Customer Chat: Auto (Firebase chat) + Manual (Admin reply)."
  },
]

const summary = [
  { system: "User Module", auto: "100%", manual: "0%" },
  { system: "Deposit", auto: "90%", manual: "10%" },
  { system: "Withdraw", auto: "70%", manual: "30%" },
  { system: "Partner", auto: "90%", manual: "10%" },
  { system: "Admin Controls", auto: "50%", manual: "50%" },
  { system: "AI Smart Actions", auto: "100%", manual: "0%" },
]


export default function SystemArchitecturePage() {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "auto":
        return "default"
      case "manual":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Fynix Pro - System Architecture</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
          Full Auto + Partial Manual System Script for a robust and scalable application.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["item-0", "item-1"]} className="w-full space-y-8">
        {sections.map((section, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="border-b-0">
            <Card className="overflow-hidden">
                <AccordionTrigger className="p-0 hover:no-underline">
                     <CardHeader className="flex flex-row items-center gap-4 flex-1 py-4 px-6">
                        <section.icon className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="text-xl text-left">{section.title}</CardTitle>
                        </div>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="p-6 pt-0">
                        {section.description && <p className="text-muted-foreground">{section.description}</p>}
                        {section.features && (
                             <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Feature</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead>Logic / Description</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {section.features.map((feature, fIndex) => (
                                    <TableRow key={fIndex}>
                                        <TableCell className="font-medium">{feature.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(feature.status || "Auto")}>
                                                {feature.status || "Auto"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{feature.description || feature.use}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        )}
                        {section.steps && (
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Step</TableHead>
                                    <TableHead className="w-[100px]">Type</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {section.steps.map((step, sIndex) => (
                                    <TableRow key={sIndex}>
                                        <TableCell className="font-medium">{step.name}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(step.type)}>{step.type}</Badge></TableCell>
                                        <TableCell>{step.description}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>

        <Card className="mt-12">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3"><CheckCircle2 className="h-7 w-7 text-primary"/>Summary (Automation Ratio)</CardTitle>
                <CardDescription>
                    ✅ 90% System Automatic (Firebase + Cloud Functions + AI) | 🧩 10% Manual (Admin Safety & Control)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>System</TableHead>
                            <TableHead className="text-right">Auto %</TableHead>
                            <TableHead className="text-right">Manual %</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {summary.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.system}</TableCell>
                                <TableCell className="text-right font-mono text-green-600">{item.auto}</TableCell>
                                <TableCell className="text-right font-mono text-red-600">{item.manual}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}

    