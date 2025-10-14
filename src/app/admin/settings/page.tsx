
"use client"

import { useEffect, useState } from "react"
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
import type { AppSettings } from "@/lib/data"
import { useFirestore } from "@/firebase/provider"
import { listenToAppSettings, updateAppSettings, addAnnouncement } from "@/lib/firestore"

export default function AdminSettingsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const firestore = useFirestore()
  
  const [settings, setSettings] = useState<Partial<AppSettings>>({})
  const [loading, setLoading] = useState(true)
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = listenToAppSettings(firestore, (newSettings) => {
        setSettings(newSettings);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  }

  const handleSettingsSave = async () => {
    if (!firestore) return;
    try {
        await updateAppSettings(firestore, settings);
        toast({
            title: "Settings Saved",
            description: "Application settings have been updated successfully.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not update settings in the database.",
        });
    }
  }
  
  const handleAnnouncementPost = async () => {
    if (!announcement.trim()) {
        toast({
            variant: "destructive",
            title: "Announcement is empty",
            description: "Please write a message before posting.",
        });
        return;
    }
    if (!firestore) return;
    try {
        await addAnnouncement(firestore, announcement);
        toast({
        title: "Announcement Sent",
        description: "The announcement has been broadcast to all users.",
        })
        setAnnouncement("")
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Post Failed",
            description: "Could not post the announcement.",
        });
    }
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
              <Label htmlFor="adminWalletName">Admin Wallet Name</Label>
              <Input 
                id="adminWalletName" 
                value={settings.adminWalletName || ""} 
                onChange={handleInputChange}
                placeholder="e.g., JazzCash, Easypaisa"
                disabled={loading}
              />
               <p className="text-xs text-muted-foreground">
                The name of the wallet service.
              </p>
            </div>
             <div className="space-y-2">
              <Label htmlFor="adminAccountHolderName">Account Holder Name</Label>
              <Input 
                id="adminAccountHolderName" 
                value={settings.adminAccountHolderName || ""} 
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
                disabled={loading}
              />
               <p className="text-xs text-muted-foreground">
                The name of the account holder.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminWalletNumber">Admin Deposit Wallet Number</Label>
              <Input 
                id="adminWalletNumber" 
                value={settings.adminWalletNumber || ""} 
                onChange={handleInputChange}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                This is the number users will send deposits to.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawalFee">Withdrawal Fee (%)</Label>
              <Input 
                id="withdrawalFee" 
                type="number"
                value={settings.withdrawalFee || ""} 
                onChange={handleInputChange}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The percentage fee deducted from all user withdrawals.
              </p>
            </div>
            <Button onClick={handleSettingsSave} disabled={loading}>Save Payment Settings</Button>
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
