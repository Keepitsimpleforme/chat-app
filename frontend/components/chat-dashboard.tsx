"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Send } from "lucide-react"

type User = {
  id: string
  name: string
  email: string
}

type OnlineUser = {
  id: string
  name: string
}

type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: number
}

type ChatDashboardProps = {
  user: User
}

export default function ChatDashboard({ user }: ChatDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Connect to Socket.io server
  useEffect(() => {
    // In a real app, this would be your actual Socket.io server URL
    const token = localStorage.getItem("token")
    console.log("Connecting to Socket.io with token:", token ? "Token exists" : "No token")
    console.log("Current user ID:", user.id)
    
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001", {
      auth: {
        token: token,
      },
    })

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.io server with socket ID:", socketInstance.id)
    
      // Inform backend about the connected user
      console.log("Emitting addUser event with user ID:", user.id)
      socketInstance.emit("addUser", String(user.id));
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    socketInstance.on("onlineUsers", (users) => {
      console.log("Received online users:", users)
      console.log("Current user ID:", user.id)
      // Filter out the current user from the online users list
      const filteredUsers = users.filter((u: OnlineUser) => String(u.id) !== String(user.id))
      console.log("Filtered online users (excluding current user):", filteredUsers)
      setOnlineUsers(filteredUsers)
    })

    socketInstance.on("receiveMessage", (message) => {
      console.log("Received message:", message)
      // Only add the message if it's from the currently selected user
      if (selectedUser && (message.senderId === selectedUser.id || message.receiverId === selectedUser.id)) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
    })

    socketInstance.on("messageSent", (message) => {
      console.log("Message sent successfully:", message)
      // Add the message to the list if you're either the sender or receiver in the current conversation
      if (selectedUser && (message.senderId === user.id || message.receiverId === selectedUser.id)) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
    })

    socketInstance.on("messageError", (error) => {
      console.error("Message error:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    })

    setSocket(socketInstance)

    return () => {
      console.log("Cleaning up socket connection")
      socketInstance.disconnect()
    }
  }, [user.id, selectedUser, toast])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleUserSelect = async (selectedUser: OnlineUser) => {
    setSelectedUser(selectedUser)
    setMessages([]) // Clear messages while loading

    try {
      // Fetch message history
      const token = localStorage.getItem("token")
      console.log("Fetching messages for user:", selectedUser.id)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages?userId=${selectedUser.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.message || "Failed to fetch messages")
      }

      const messageHistory = await response.json()
      console.log("Loaded message history:", messageHistory)
      
      // Sort messages by timestamp
      const sortedMessages = messageHistory.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      console.log("Sorted messages:", sortedMessages)
      setMessages(sortedMessages)
    } catch (error) {
      console.error("Error loading message history:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load message history",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedUser || !socket) return

    const newMessage = {
      senderId: user.id,
      receiverId: selectedUser.id,
      content: messageInput,
    }

    socket.emit("sendMessage", newMessage)
    setMessageInput("")
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid time";
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.replace("/")
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar with online users */}
      <div className="w-1/4 border-r p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Online Users</h2>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        <div className="space-y-2">
          {onlineUsers.length === 0 ? (
            <p className="text-gray-500">No users online</p>
          ) : (
            onlineUsers.map((u) => (
              <div
                key={u.id}
                className={`p-3 rounded-lg cursor-pointer ${
                  selectedUser?.id === u.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                onClick={() => handleUserSelect(u)}
              >
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <Badge variant="outline" className="text-xs">
                      Online
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <Badge variant="outline" className="text-xs">
                    Online
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">No messages yet. Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id || `${message.senderId}-${message.timestamp}`}
                      className={`flex ${message.senderId === user.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.senderId === user.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Card className="w-1/2">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-medium mb-2">Welcome to the Chat App</h3>
                <p className="text-gray-500">
                  Select a user from the sidebar to start chatting.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
