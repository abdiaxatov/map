"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, Globe, UserPlus, UserCheck, UserX } from "lucide-react"
import type { User } from "firebase/auth"
import type { RoomDetails, UserCursor } from "@/hooks/use-map-data"
import { getFirebaseDatabase } from "@/lib/firebase"
import { ref, get, remove } from "firebase/database"

interface GroupManagementProps {
  currentUser: User | null
  roomId: string | null // roomDetails o'rniga roomId
  roomDetails: RoomDetails | null
  users: UserCursor[]
  onClose: () => void
  onApproveUser: (userId: string) => void
}

interface PendingRequest {
  id: string
  name: string
  imgsrc: string | null
  timestamp: number
}

export function GroupManagement({
  currentUser,
  roomId,
  roomDetails,
  users,
  onClose,
  onApproveUser,
}: GroupManagementProps) {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(false)

  const isAdmin = currentUser && roomDetails && roomDetails.admin === currentUser.uid

  useEffect(() => {
    if (!roomId || !isAdmin) return // roomDetails o'rniga roomId

    const fetchPendingRequests = async () => {
      try {
        const database = getFirebaseDatabase()
        const pendingRef = ref(database, `rooms/${roomId}/pendingRequests`) // roomDetails o'rniga roomId
        const snapshot = await get(pendingRef)

        if (snapshot.exists()) {
          const requests: PendingRequest[] = []
          snapshot.forEach((child) => {
            const data = child.val()
            requests.push({
              id: child.key!,
              name: data?.name || "Unknown User", // Default qiymat
              imgsrc: data?.imgsrc || null,
              timestamp: data?.timestamp || Date.now(),
            })
          })
          setPendingRequests(requests)
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error)
      }
    }

    fetchPendingRequests()
  }, [roomId, isAdmin]) // roomDetails o'rniga roomId

  const handleApproveRequest = async (userId: string) => {
    if (!roomDetails || !isAdmin) return

    setLoading(true)
    try {
      onApproveUser(userId)
      setPendingRequests((prev) => prev.filter((req) => req.id !== userId))
    } catch (error) {
      console.error("Error approving request:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectRequest = async (userId: string) => {
    if (!roomId || !isAdmin) return // roomDetails o'rniga roomId

    setLoading(true)
    try {
      const database = getFirebaseDatabase()
      await remove(ref(database, `rooms/${roomId}/pendingRequests/${userId}`)) // roomDetails o'rniga roomId
      setPendingRequests((prev) => prev.filter((req) => req.id !== userId))
    } catch (error) {
      console.error("Error rejecting request:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!roomId || !isAdmin || userId === currentUser?.uid) return // roomDetails o'rniga roomId

    setLoading(true)
    try {
      const database = getFirebaseDatabase()
      await remove(ref(database, `rooms/${roomId}/details/members/${userId}`)) // roomDetails o'rniga roomId
      await remove(ref(database, `rooms/${roomId}/users/${userId}`)) // roomDetails o'rniga roomId
    } catch (error) {
      console.error("Error removing member:", error)
    } finally {
      setLoading(false)
    }
  }

  const activeMembers = users.filter((user) => user.active)
  const totalMembers = roomDetails?.members ? Object.keys(roomDetails.members).length : 0

  // Safe function to get first character
  const getFirstChar = (name: string | null | undefined): string => {
    if (!name || typeof name !== "string" || name.length === 0) {
      return "?"
    }
    return name.charAt(0).toUpperCase()
  }

  // Safe function to get display name
  const getDisplayName = (name: string | null | undefined): string => {
    if (!name || typeof name !== "string" || name.trim() === "") {
      return "Unknown User"
    }
    return name
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Guruh boshqaruvi
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{roomDetails?.name || "Unknown Room"}</h3>
              <Badge variant={roomDetails?.type === "private" ? "destructive" : "secondary"}>
                {roomDetails?.type === "private" ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Yopiq
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3 mr-1" />
                    Ochiq
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{roomDetails?.description || "No description"}</p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Jami a'zolar: {totalMembers}</span>
              <span>Faol: {activeMembers.length}</span>
            </div>
          </div>

          {/* Pending Requests (Admin only) */}
          {isAdmin && pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Kutilayotgan so'rovlar ({pendingRequests.length})
              </h4>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {request.imgsrc ? (
                        <img
                          src={request.imgsrc || "/placeholder.svg"}
                          alt={getDisplayName(request.name)}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                          {getFirstChar(request.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{getDisplayName(request.name)}</p>
                        <p className="text-xs text-gray-500">
                          {request.timestamp ? new Date(request.timestamp).toLocaleString() : "Unknown time"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={loading}
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        Tasdiqlash
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={loading}
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Rad etish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Members */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Faol a'zolar ({activeMembers.length})
            </h4>
            <div className="space-y-2">
              {activeMembers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {user.imgsrc ? (
                      <img
                        src={user.imgsrc || "/placeholder.svg"}
                        alt={getDisplayName(user.name)}
                        className="w-8 h-8 rounded-full"
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
                      {user.id === roomDetails?.admin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Faol</span>
                    {isAdmin && user.id !== currentUser?.uid && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveMember(user.id)}
                        disabled={loading}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
