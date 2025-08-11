"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Eye } from "lucide-react"
import type { UserCursor } from "@/hooks/use-map-data"
import type { User as FirebaseUser } from "firebase/auth"
import Image from "next/image"

interface UserListModalProps {
  users: UserCursor[]
  currentUser: FirebaseUser | null
  onObserveUser: (userId: string) => void
  onClose: () => void
}

export function UserListModal({ users, currentUser, onObserveUser, onClose }: UserListModalProps) {
  const activeUsers = users.filter((user) => user.active && user.id !== currentUser?.uid)

  const getFirstChar = (name: string | null | undefined): string => {
    if (!name || typeof name !== "string" || name.length === 0) {
      return "?"
    }
    return name.charAt(0).toUpperCase()
  }

  const getDisplayName = (name: string | null | undefined): string => {
    if (!name || typeof name !== "string" || name.trim() === "") {
      return "Unknown User"
    }
    return name
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden mx-4 flex flex-col">
        <CardHeader className="pb-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Faol foydalanuvchilar ({activeUsers.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-3">
              {activeUsers.length > 0 ? (
                activeUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {user.imgsrc ? (
                        <Image
                          src={user.imgsrc || "/placeholder.svg"}
                          alt={getDisplayName(user.name)}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: user.color || "#666666" }}
                        >
                          {getFirstChar(user.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{getDisplayName(user.name)}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Faol</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onObserveUser(user.id)
                        onClose() // Close modal after observing
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Kuzatish
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">Hozirda faol foydalanuvchilar yo'q.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
