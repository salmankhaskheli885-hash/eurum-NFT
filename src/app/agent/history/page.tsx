
"use client"
import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Search } from "lucide-react"
import { useFirestore } from "@/firebase/provider"
import { listenToChatRooms, type ChatRoom } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function ChatHistoryList({ rooms, loading }: { rooms: ChatRoom[], loading: boolean }) {
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredRooms = React.useMemo(() => {
        if (!searchTerm) return rooms;
        const lowercasedFilter = searchTerm.toLowerCase();
        return rooms.filter(room =>
            room.userName.toLowerCase().includes(lowercasedFilter) ||
            room.userId.toLowerCase().includes(lowercasedFilter) ||
            room.lastMessage.toLowerCase().includes(lowercasedFilter)
        );
    }, [rooms, searchTerm]);

    if (loading) {
        return (
            <div className="space-y-2 p-2">
                {[...Array(5)].map((_, i) => (
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
                <h3 className="mt-4 text-lg font-semibold">No Chat History</h3>
                <p className="mt-1 text-sm text-muted-foreground">Completed chats will appear here.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by user name, ID, or message..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-grow">
                <div className="flex flex-col gap-2 p-2">
                    {filteredRooms.map((room) => (
                        <div
                            key={room.id}
                            className="flex items-center gap-4 p-2 rounded-lg text-left transition-colors w-full hover:bg-muted"
                        >
                            <Avatar className="h-12 w-12 border">
                                <AvatarFallback>{room.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                                <div className="font-semibold">{room.userName}</div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {room.lastMessage}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(room.lastMessageAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                {room.isResolved ? (
                                    <span className="text-xs font-medium text-green-600">Resolved</span>
                                ) : (
                                    <span className="text-xs font-medium text-blue-600">Active</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

export default function AgentChatHistoryPage() {
    const firestore = useFirestore();
    const [rooms, setRooms] = React.useState<ChatRoom[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const unsubscribe = listenToChatRooms(firestore, (newRooms) => {
            setRooms(newRooms); // Fetches all rooms for history
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Chat History</h1>
                <p className="text-muted-foreground">Review past conversations with users.</p>
            </div>
            <Card className="flex-grow">
                <ChatHistoryList rooms={rooms} loading={loading} />
            </Card>
        </div>
    )
}
