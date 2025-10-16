
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea"

function ChangePasswordForm() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: t('settings.password.mismatchTitle'),
                description: t('settings.password.mismatchDescription'),
            })
            return
        }
        // Placeholder for actual password change logic
        console.log("Changing password...")
        toast({
            title: t('settings.password.successTitle'),
            description: t('settings.password.successDescription'),
        })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('settings.password.title')}</CardTitle>
                <CardDescription>{t('settings.password.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">{t('settings.password.current')}</Label>
                        <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">{t('settings.password.new')}</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t('settings.password.confirm')}</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <Button type="submit">{t('settings.password.submitButton')}</Button>
                </form>
            </CardContent>
        </Card>
    )
}

const faqData = [
    {
        question: "partner.faq.q1.question",
        answer: "partner.faq.q1.answer",
    },
    {
        question: "partner.faq.q2.question",
        answer: "partner.faq.q2.answer",
    },
    {
        question: "partner.faq.q3.question",
        answer: "partner.faq.q3.answer",
    },
];


function FaqSection() {
    const { t } = useTranslation()
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('settings.faq.title')}</CardTitle>
                <CardDescription>{t('settings.faq.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {faqData.map((item, index) => (
                         <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>{t(item.question)}</AccordionTrigger>
                            <AccordionContent>{t(item.answer)}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}

function ContactUsForm() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder for submission logic
        console.log({ subject, message });
        toast({
            title: t('partner.settings.contact.successTitle'),
            description: t('partner.settings.contact.successDescription'),
        });
        setSubject('');
        setMessage('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('partner.settings.contact.title')}</CardTitle>
                <CardDescription>{t('partner.settings.contact.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">{t('partner.settings.contact.subject')}</Label>
                        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">{t('partner.settings.contact.message')}</Label>
                        <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required />
                    </div>
                    <Button type="submit">{t('partner.settings.contact.submitButton')}</Button>
                </form>
            </CardContent>
        </Card>
    );
}


function StaticContentCard({ titleKey, descriptionKey, contentKey }: { titleKey: string, descriptionKey: string, contentKey: string }) {
    const { t } = useTranslation()
    return (
         <Card>
            <CardHeader>
                <CardTitle>{t(titleKey)}</CardTitle>
                <CardDescription>{t(descriptionKey)}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                    <p>{t(contentKey)}</p>
                </div>
            </CardContent>
        </Card>
    )
}


export default function SettingsPage() {
    const { t } = useTranslation()

    return (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
                <p className="text-muted-foreground">{t('settings.description')}</p>
            </div>
            <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="password">{t('settings.tabs.password')}</TabsTrigger>
                    <TabsTrigger value="faq">{t('settings.tabs.faq')}</TabsTrigger>
                    <TabsTrigger value="services">{t('settings.tabs.services')}</TabsTrigger>
                    <TabsTrigger value="guidelines">{t('settings.tabs.guidelines')}</TabsTrigger>
                    <TabsTrigger value="contact">{t('partner.settings.tabs.contact')}</TabsTrigger>
                </TabsList>
                <TabsContent value="password" className="mt-6">
                    <ChangePasswordForm />
                </TabsContent>
                <TabsContent value="faq" className="mt-6">
                    <FaqSection />
                </TabsContent>
                <TabsContent value="services" className="mt-6">
                    <StaticContentCard 
                        titleKey="settings.services.title"
                        descriptionKey="settings.services.description"
                        contentKey="settings.services.content"
                    />
                </TabsContent>
                 <TabsContent value="guidelines" className="mt-6">
                     <StaticContentCard 
                        titleKey="settings.guidelines.title"
                        descriptionKey="settings.guidelines.description"
                        contentKey="settings.guidelines.content"
                    />
                </TabsContent>
                 <TabsContent value="contact" className="mt-6">
                    <ContactUsForm />
                </TabsContent>
            </Tabs>
        </div>
    )
}

    