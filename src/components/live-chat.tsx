"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MessageSquare, Send, X } from "lucide-react"
import { useTranslation } from '@/hooks/use-translation'

export function LiveChat() {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { from: 'support', text: t('liveChat.welcome') }
    ])
    const [input, setInput] = useState('')

    const handleSend = () => {
        if (input.trim()) {
            setMessages([...messages, { from: 'user', text: input }])
            setInput('')
            // Simulate support reply
            setTimeout(() => {
                setMessages(prev => [...prev, { from: 'support', text: t('liveChat.supportReply') }])
            }, 1500)
        }
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
                        <ScrollArea className="h-full p-6">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex items-end gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-lg p-3 text-sm ${msg.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            {msg.text}
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
