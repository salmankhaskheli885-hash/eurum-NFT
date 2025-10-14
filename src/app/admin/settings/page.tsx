
"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Textarea } from "@/components/ui/textarea"

// This would typically come from a remote config or database
const INITIAL_ADMIN_WALLET_NUMBER = "0300-1234567"

export default function AdminSettingsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  
  const [walletNumber, setWalletNumber] = useState(INITIAL_ADMIN_WALLET_NUMBER)
  const [withdrawalFee, setWithdrawalFee] = useState("2")
  const [announcement, setAnnouncement] = useState("")

  const handleSettingsSave = () => {
    // In a real app, this would save the settings to Firebase
    console.log("Saving settings:", { walletNumber, withdrawalFee })
    toast({
      title: "Settings Saved",
      description: "Application settings have been updated successfully.",
    })
  }
  
  const handleAnnouncementPost = () => {
    // In a real app, this would push the announcement to users via FCM
    console.log("Posting announcement:", announcement)
    toast({
      title: "Announcement Sent",
      description: "The announcement has been broadcast to all users.",
    })
    setAnnouncement("")
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.nav.settings')}</h1>
        <p className="text-muted-foreground">Manage global application settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>
              Configure deposit and withdrawal parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="wallet-number">Admin Deposit Wallet Number</Label>
              <Input 
                id="wallet-number" 
                value={walletNumber} 
                onChange={(e) => setWalletNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This is the JazzCash/Easypaisa number users will send deposits to.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-fee">Withdrawal Fee (%)</Label>
              <Input 
                id="withdrawal-fee" 
                type="number"
                value={withdrawalFee} 
                onChange={(e) => setWithdrawalFee(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The percentage fee deducted from all user withdrawals.
              </p>
            </div>
            <Button onClick={handleSettingsSave}>Save Payment Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Post an Announcement</CardTitle>
            <CardDescription>
              Broadcast a message to all users. It will appear as a notification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Announcement Message</Label>
              <Textarea 
                id="announcement-message"
                placeholder="E.g., System maintenance will be performed tonight at 2 AM."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
              />
            </div>
            <Button onClick={handleAnnouncementPost}>Post Announcement</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
