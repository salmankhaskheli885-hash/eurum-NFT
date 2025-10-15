
"use client"

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MessageSquare, Send, X } from "lucide-react"
import { useTranslation } from '@/hooks/use-translation'
import { useUser } from '@/hooks/use-user'
import { useFirestore } from '@/firebase/provider'
import { getOrCreateChatRoom, listenToMessages, sendMessage, type ChatMessage } from '@/lib/firestore'
import { cn } from '@/lib/utils'

export function LiveChat() {
    const { t } = useTranslation()
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const [isOpen, setIsOpen] = React.useState(false)
    const [messages, setMessages] = React.useState<ChatMessage[]>([])
    const [input, setInput] = React.useState('')
    const [roomId, setRoomId] = React.useState<string | null>(null);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);


    React.useEffect(() => {
        if (!isOpen || !firestore || !user) return;

        const initChat = async () => {
            const room = await getOrCreateChatRoom(firestore, user);
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
        if (!input.trim() || !firestore || !user || !roomId) return;
        
        try {
            await sendMessage(firestore, roomId, user.uid, 'user', input.trim());
            setInput('')
        } catch (error) {
            console.error("Failed to send message:", error)
        }
    }

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
                <Card className="flex flex-col h-[28rem] border-0">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle>{t('liveChat.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden p-0">
                        <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={cn("flex", msg.senderType === 'user' ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            "max-w-xs rounded-lg px-4 py-2",
                                            msg.senderType === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            <p className="text-sm">{msg.text}</p>
                                             <p className="text-xs text-right mt-1 opacity-70">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-4 border-t flex-shrink-0">
                         <div className="flex w-full items-center space-x-2">
                            <Input 
                                placeholder={t('liveChat.placeholder')} 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <Button onClick={handleSend} size="icon" disabled={!input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </PopoverContent>
        </Popover>
    )
}
