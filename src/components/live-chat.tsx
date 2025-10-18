
"use client"

import * as React from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MessageSquare, Send, X, Paperclip, Loader2 } from "lucide-react"
import { useTranslation } from '@/hooks/use-translation'
import { useUser } from '@/hooks/use-user'
import { useFirestore } from '@/firebase/provider'
import { getOrCreateChatRoom, listenToMessages, sendMessage, type ChatMessage } from '@/lib/firestore'
import { cn } from '@/lib/utils'
import { UserProfile } from '@/lib/schema'
import { Label } from './ui/label'
import imageCompression from 'browser-image-compression';

export function LiveChat() {
    const { t } = useTranslation()
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const [isOpen, setIsOpen] = React.useState(false)
    const [messages, setMessages] = React.useState<ChatMessage[]>([])
    const [input, setInput] = React.useState('')
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [isSending, setIsSending] = React.useState(false);
    const [roomId, setRoomId] = React.useState<string | null>(null);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);


    React.useEffect(() => {
        if (!isOpen || !firestore || !user) return;

        const initChat = async () => {
            const room = await getOrCreateChatRoom(firestore, user as UserProfile);
            setRoomId(room.id);
        }
        initChat();

    }, [isOpen, firestore, user]);

    React.useEffect(() => {
        if (!roomId || !firestore) return;

        const unsubscribe = listenToMessages(firestore, roomId, (newMessages) => {
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [roomId, firestore]);
    
    React.useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);


    const handleSend = async () => {
        if ((!input.trim() && !imageFile) || !firestore || !user || !roomId) return;
        
        setIsSending(true);
        try {
            await sendMessage(firestore, roomId, user.uid, 'user', input.trim(), imageFile ? { file: imageFile, compressor: imageCompression } : undefined);
            setInput('');
            setImageFile(null);
             if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Failed to send message:", error)
        } finally {
            setIsSending(false);
        }
    }
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImageFile(event.target.files[0]);
        }
    };

    if (userLoading || !user) {
        return null; // Don't show chat button if user is not logged in
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="default" className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg">
                    {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-80 p-0 rounded-lg shadow-2xl mr-4 mb-2">
                <Card className="flex flex-col h-[32rem] border-0">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle>{t('liveChat.title')}</CardTitle>
                        <CardDescription>{t('liveChat.supportReply')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden p-0">
                        <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={cn("flex", msg.senderType === 'user' ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            "max-w-xs rounded-lg px-3 py-2",
                                            msg.senderType === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            {msg.imageUrl && (
                                                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                    <Image src={msg.imageUrl} alt="Chat image" width={200} height={200} className="rounded-md object-cover"/>
                                                </a>
                                            )}
                                            {msg.text && <p className="text-sm mt-1">{msg.text}</p>}
                                             <p className="text-xs text-right mt-1 opacity-70">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-2 border-t flex-col flex-shrink-0 items-start">
                         {imageFile && (
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                                Attached: {imageFile.name}
                            </div>
                        )}
                         <div className="flex w-full items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip className="h-5 w-5" />
                                <span className="sr-only">Attach file</span>
                            </Button>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                            <Input 
                                placeholder={t('liveChat.placeholder')} 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <Button onClick={handleSend} size="icon" disabled={(!input.trim() && !imageFile) || isSending}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </PopoverContent>
        </Popover>
    )
}

    