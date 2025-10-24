
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
import { CheckCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    // @ts-ignore
    const isNumber = type === 'number' && e.nativeEvent.inputType !== 'e';
    setSettings(prev => ({ ...prev, [id]: isNumber ? (value === '' ? '' : Number(value)) : value }));
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
    <TooltipProvider>
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
            </div>
             <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <Label htmlFor="adminAccountHolderName">Account Holder Name</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <CheckCircle className="h-4 w-4 text-blue-500 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Verified by WhatsApp</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
              <Input 
                id="adminAccountHolderName" 
                value={settings.adminAccountHolderName || ""} 
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminWalletNumber">Admin Deposit Wallet Number</Label>
              <Input 
                id="adminWalletNumber" 
                value={settings.adminWalletNumber || ""} 
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="minDeposit">Min Deposit</Label>
                <Input 
                    id="minDeposit" 
                    type="number"
                    value={settings.minDeposit ?? ""} 
                    onChange={handleInputChange}
                    disabled={loading}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="maxDeposit">Max Deposit</Label>
                <Input 
                    id="maxDeposit" 
                    type="number"
                    value={settings.maxDeposit ?? ""} 
                    onChange={handleInputChange}
                    disabled={loading}
                />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="minWithdrawal">Min Withdrawal</Label>
                    <Input 
                        id="minWithdrawal" 
                        type="number"
                        value={settings.minWithdrawal ?? ""} 
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="maxWithdrawal">Max Withdrawal</Label>
                    <Input 
                        id="maxWithdrawal" 
                        type="number"
                        value={settings.maxWithdrawal ?? ""} 
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                </div>
             </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawalFee">Withdrawal Fee (%)</Label>
              <Input 
                id="withdrawalFee" 
                type="number"
                value={settings.withdrawalFee ?? ""} 
                onChange={handleInputChange}
                disabled={loading}
              />
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
    </TooltipProvider>
  )
}
