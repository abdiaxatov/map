"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Users, Smile, MoreHorizontal } from "lucide-react" // MoreHorizontal icon qo'shildi
import type { ChatMessage, UserCursor } from "@/hooks/use-map-data"
import type { User as FirebaseUser } from "firebase/auth"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ChatPanelProps {
  currentUser: FirebaseUser | null
  users: UserCursor[]
  messages: ChatMessage[]
  onSendMessage: (
    message: string,
    type?: "group" | "private",
    targetUserId?: string,
    sticker?: string,
    replyToMessageId?: string,
    replyToMessageContent?: string,
  ) => void
  onEditMessage: (messageId: string, newMessage: string) => void
  onDeleteMessage: (messageId: string) => void
}

const stickers = ["❤️", "😂", "👍", "🎉", "🔥", "💡", "🤔", "🥳", "😎", "🤩", "💯", "👏", "🙏", "🚀", "🌟", "🤯"]

export function ChatPanel({
  currentUser,
  users,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
}: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("")
  const [chatMode, setChatMode] = useState<"group" | "private">("group")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedUser && !replyingToMessage) return // Allow sending stickers without text

    if (editingMessageId) {
      onEditMessage(editingMessageId, newMessage.trim())
      setEditingMessageId(null)
    } else {
      onSendMessage(
        newMessage.trim(),
        chatMode,
        selectedUser || undefined,
        undefined, // sticker
        replyingToMessage?.id,
        replyingToMessage?.message || replyingToMessage?.sticker,
      )
    }
    setNewMessage("")
    setReplyingToMessage(null)
  }

  const handleSendSticker = (sticker: string) => {
    if (editingMessageId) {
      // Stickers cannot be edited into existing text messages
      setEditingMessageId(null)
    }
    onSendMessage("", chatMode, selectedUser || undefined, sticker, replyingToMessage?.id, replyingToMessage?.message)
    setNewMessage("")
    setReplyingToMessage(null)
  }

  const handleEditClick = (message: ChatMessage) => {
    setEditingMessageId(message.id)
    setNewMessage(message.message || "")
    setReplyingToMessage(null) // Tahrirlashda javob berishni bekor qilish
  }

  const handleReplyClick = (message: ChatMessage) => {
    setReplyingToMessage(message)
    setNewMessage("") // Javob berishda yangi xabar maydonini tozalash
    setEditingMessageId(null) // Javob berishda tahrirlashni bekor qilish
  }

  const handleDeleteClick = (messageId: string) => {
    onDeleteMessage(messageId)
  }

  const filteredMessages = messages.filter((msg) => {
    if (chatMode === "group") {
      return msg.type === "group"
    } else {
      // Private messages are visible to both sender and receiver
      return (
        msg.type === "private" &&
        ((msg.userId === currentUser?.uid && msg.targetUserId === selectedUser) ||
          (msg.targetUserId === currentUser?.uid && msg.userId === selectedUser))
      )
    }
  })

  const activeUsers = users.filter((user) => user.active && user.id !== currentUser?.uid)
  const selectedUserData = selectedUser ? users.find((u) => u.id === selectedUser) : null

  return (
    <Card className="h-full flex flex-col rounded-md border shadow-lg">
      <CardHeader className="pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Chat
          </CardTitle>
          {/* Chat panel modal bo'lmagani uchun onClose tugmasi olib tashlandi */}
        </div>

        {/* Chat Mode Selector */}
        <div className="flex gap-1 mt-2">
          <Button
            variant={chatMode === "group" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setChatMode("group")
              setSelectedUser(null)
            }}
            className="flex-1"
          >
            <Users className="h-3 w-3 mr-1" />
            Guruh
          </Button>
          <Button
            variant={chatMode === "private" ? "default" : "outline"}
            size="sm"
            onClick={() => setChatMode("private")}
            className="flex-1"
          >
            Shaxsiy
          </Button>
        </div>

        {/* User Selector for Private Chat */}
        {chatMode === "private" && (
          <div className="space-y-1 mt-2">
            <div className="text-xs text-gray-500">Foydalanuvchini tanlang:</div>
            <div className="flex flex-wrap gap-1">
              {activeUsers.length > 0 ? (
                activeUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant={selectedUser === user.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedUser(user.id)}
                    className="text-xs h-6"
                  >
                    {user.name}
                  </Button>
                ))
              ) : (
                <span className="text-xs text-gray-400">Faol foydalanuvchilar yo'q</span>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-2 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-2">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userId === currentUser?.uid ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group relative max-w-[80%] p-2 rounded-lg text-sm ${
                    message.userId === currentUser?.uid ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.userId !== currentUser?.uid && (
                    <div className="text-xs font-medium mb-1" style={{ color: message.userColor }}>
                      {message.userName}
                      {message.type === "private" && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Shaxsiy
                        </Badge>
                      )}
                    </div>
                  )}
                  {message.replyToMessageContent && (
                    <div
                      className={`mb-1 p-1 rounded text-xs ${
                        message.userId === currentUser?.uid ? "bg-blue-600" : "bg-gray-200"
                      } border-l-2 ${
                        message.userId === currentUser?.uid ? "border-blue-300" : "border-gray-400"
                      } text-gray-300`}
                    >
                      {message.replyToMessageContent.length > 50
                        ? message.replyToMessageContent.substring(0, 50) + "..."
                        : message.replyToMessageContent}
                    </div>
                  )}
                  {message.sticker ? <span className="text-3xl">{message.sticker}</span> : <div>{message.message}</div>}
                  <div className="text-xs opacity-70 mt-1 flex justify-between items-center">
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                    {message.edited && <span className="ml-2">(tahrirlangan)</span>}
                  </div>

                  {message.userId === currentUser?.uid && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 right-0 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-auto p-1">
                        <DropdownMenuItem onClick={() => handleEditClick(message)}>Tahrirlash</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReplyClick(message)}>Javob berish</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(message.id)}>O'chirish</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="shrink-0 bg-transparent">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 flex flex-wrap gap-1">
              {stickers.map((sticker) => (
                <Button
                  key={sticker}
                  variant="ghost"
                  size="icon"
                  className="text-xl"
                  onClick={() => handleSendSticker(sticker)}
                >
                  {sticker}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              editingMessageId
                ? "Xabarni tahrirlang..."
                : replyingToMessage
                  ? `${replyingToMessage.userName}ga javob berish...`
                  : chatMode === "group"
                    ? "Guruhga xabar yozing..."
                    : selectedUser
                      ? `${selectedUserData?.name}ga xabar yozing...`
                      : "Foydalanuvchini tanlang"
            }
            disabled={!currentUser || (chatMode === "private" && !selectedUser && !editingMessageId)}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={(!newMessage.trim() && !selectedUser && !replyingToMessage) || !currentUser}
          >
            <Send className="h-3 w-3" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
