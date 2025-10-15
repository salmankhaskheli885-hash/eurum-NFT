
"use client"
import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Bot } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useFirestore } from "@/firebase/provider"
import { listenToChatRooms, listenToMessages, sendMessage, type ChatRoom, type ChatMessage } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function ChatRoomList({ rooms, onSelectRoom, selectedRoomId, loading }: { rooms: ChatRoom[], onSelectRoom: (roomId: string) => void, selectedRoomId: string | null, loading: boolean }) {
    if (loading) {
        return (
            <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Bot className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Active Chats</h3>
                <p className="mt-1 text-sm text-muted-foreground">When a user starts a new chat, it will appear here.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2">
                {rooms.map((room) => (
                    <button
                        key={room.id}
                        onClick={() => onSelectRoom(room.id)}
                        className={cn(
                            "flex items-center gap-4 p-2 rounded-lg text-left transition-colors w-full",
                            selectedRoomId === room.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                    >
                        <Avatar className="h-12 w-12 border">
                            <AvatarFallback>{room.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 truncate">
                            <div className="font-semibold">{room.userName}</div>
                            <p className={cn("text-sm truncate", selectedRoomId === room.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                {room.lastMessage}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    )
}

function ChatWindow({ room, messages, agentId, loading }: { room: ChatRoom, messages: ChatMessage[], agentId: string, loading: boolean }) {
    const firestore = useFirestore();
    const [input, setInput] = React.useState('');
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);


    const handleSend = async () => {
        if (!firestore || !input.trim()) return;
        
        try {
            await sendMessage(firestore, room.id, agentId, 'agent', input.trim());
            setInput('');
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };
    
    return (
        <div className="flex flex-col h-full">
             <CardHeader className="flex-shrink-0">
                <CardTitle>Chat with {room.userName}</CardTitle>
                <CardDescription>User ID: {room.userId}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="p-6 space-y-4">
                        {loading && messages.length === 0 ? (
                             <div className="space-y-4">
                                <div className="flex justify-start"><Skeleton className="h-10 w-48 rounded-lg"/></div>
                                <div className="flex justify-end"><Skeleton className="h-10 w-32 rounded-lg"/></div>
                                <div className="flex justify-start"><Skeleton className="h-12 w-64 rounded-lg"/></div>
                            </div>
                        ) : messages.map((msg, index) => (
                             <div key={index} className={cn("flex", msg.senderType === 'agent' ? 'justify-end' : 'justify-start')}>
                                <div className={cn(
                                    "max-w-xs rounded-lg px-4 py-2",
                                    msg.senderType === 'agent' ? "bg-primary text-primary-foreground" : "bg-muted"
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
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button onClick={handleSend} disabled={!input.trim()}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </CardFooter>
        </div>
    );
}


export default function AgentDashboardPage() {
    const firestore = useFirestore();
    const { user: agent, loading: agentLoading } = useUser();

    const [rooms, setRooms] = React.useState<ChatRoom[]>([]);
    const [roomsLoading, setRoomsLoading] = React.useState(true);
    const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(null);
    
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = React.useState(false);


    React.useEffect(() => {
        if (!firestore) return;
        setRoomsLoading(true);
        const unsubscribe = listenToChatRooms(firestore, (newRooms) => {
            const activeRooms = newRooms.filter(room => !room.isResolved);
            setRooms(activeRooms);
            setRoomsLoading(false);
            
            // If there's no selected room OR the selected room is no longer in the active list, select the first active room.
            if (!selectedRoomId || !activeRooms.find(r => r.id === selectedRoomId)) {
                setSelectedRoomId(activeRooms.length > 0 ? activeRooms[0].id : null);
            }
        });

        return () => unsubscribe();
    }, [firestore, selectedRoomId]); // Re-run if selectedRoomId changes to re-evaluate the selection
    
    React.useEffect(() => {
        if (!firestore || !selectedRoomId) {
            setMessages([]);
            return;
        };
        setMessagesLoading(true);
        const unsubscribe = listenToMessages(firestore, selectedRoomId, (newMessages) => {
            setMessages(newMessages);
            setMessagesLoading(false);
        });
        
        return () => unsubscribe();
    }, [firestore, selectedRoomId]);
    
    const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-5rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Chats</h1>
        <p className="text-muted-foreground">Respond to users who need help.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>User Inbox</CardTitle>
            <CardDescription>Select a user to start a conversation.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 overflow-hidden">
            <ChatRoomList rooms={rooms} onSelectRoom={setSelectedRoomId} selectedRoomId={selectedRoomId} loading={roomsLoading} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 flex flex-col">
            {selectedRoom && agent ? (
                <ChatWindow room={selectedRoom} messages={messages} agentId={agent.uid} loading={messagesLoading} />
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Bot className="h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Chat Selected</h3>
                    <p className="mt-1 text-muted-foreground">Please select an active chat from the list to view the conversation.</p>
                </div>
            )}
        </Card>
      </div>
    </div>
  )
}
