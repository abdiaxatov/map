"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, Trash2, Users, Eye, EyeOff, LogOut, Lock, Globe, Navigation } from "lucide-react"
import type { MapObject, UserCursor, RoomDetails } from "@/hooks/use-map-data"
import type { User } from "firebase/auth"
import Image from "next/image"

interface AppSidebarProps {
  mapName: string
  mapDescription: string
  onUpdateMapName: (name: string) => void
  onUpdateMapDescription: (description: string) => void
  objects: MapObject[]
  onDeleteObject: (objectId: string) => void
  onToggleAnnotations: () => void
  hideAnnotations: boolean
  onFocusLayer: (objectId: string) => void
  users: UserCursor[]
  currentUser: User | null
  mapDetails: RoomDetails | null
  onToggleCursorBroadcast: (broadcast: boolean) => void
  onLogout: () => void
  onToggleLocationTracking: (isTracking: boolean) => void
  isLocationTracking: boolean
  currentUserData: UserCursor | undefined
}

export function AppSidebar({
  mapName,
  mapDescription,
  onUpdateMapName,
  onUpdateMapDescription,
  objects,
  onDeleteObject,
  onToggleAnnotations,
  hideAnnotations,
  onFocusLayer,
  users,
  currentUser,
  mapDetails,
  onToggleCursorBroadcast,
  onLogout,
  onToggleLocationTracking,
  isLocationTracking,
  currentUserData,
}: AppSidebarProps) {
  const [editingName, setEditingName] = React.useState(false)
  const [editingDescription, setEditingDescription] = React.useState(false)
  const [currentMapName, setCurrentMapName] = React.useState(mapName)
  const [currentMapDescription, setCurrentMapDescription] = React.useState(mapDescription)
  const [isBroadcastingCursor, setIsBroadcastingCursor] = React.useState(currentUserData?.isBroadcastingCursor ?? true)

  React.useEffect(() => {
    setCurrentMapName(mapName)
  }, [mapName])

  React.useEffect(() => {
    setCurrentMapDescription(mapDescription)
  }, [mapDescription])

  React.useEffect(() => {
    setIsBroadcastingCursor(currentUserData?.isBroadcastingCursor ?? true)
  }, [currentUserData])

  const handleNameSave = () => {
    setEditingName(false)
    onUpdateMapName(currentMapName)
  }

  const handleDescriptionSave = () => {
    setEditingDescription(false)
    onUpdateMapDescription(currentMapDescription)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (editingName) handleNameSave()
      if (editingDescription) handleDescriptionSave()
    } else if (e.key === "Escape") {
      if (editingName) {
        setCurrentMapName(mapName)
        setEditingName(false)
      }
      if (editingDescription) {
        setCurrentMapDescription(mapDescription)
        setEditingDescription(false)
      }
    }
  }

  const getObjectIcon = (object: MapObject) => {
    switch (object.type) {
      case "marker":
        return <MapPin className="w-4 h-4" style={{ color: object.color }} />
      default:
        return <div className="w-4 h-4 rounded-full" style={{ backgroundColor: object.color }} />
    }
  }

  const isAdmin = currentUser && mapDetails && mapDetails.admin === currentUser.uid

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        {editingName ? (
          <Input
            value={currentMapName}
            onChange={(e) => setCurrentMapName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleKeyDown}
            className="text-lg font-semibold"
            autoFocus
          />
        ) : (
          <h1
            className="text-lg font-semibold cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => setEditingName(true)}
          >
            {currentMapName}
          </h1>
        )}

        {editingDescription ? (
          <Textarea
            value={currentMapDescription}
            onChange={(e) => setCurrentMapDescription(e.target.value)}
            onBlur={handleDescriptionSave}
            onKeyDown={handleKeyDown}
            className="mt-2 text-sm"
            autoFocus
            rows={2}
          />
        ) : (
          <p
            className="mt-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => setEditingDescription(true)}
          >
            {currentMapDescription || "Click to add description"}
          </p>
        )}
      </div>

      <Tabs defaultValue="layers" className="flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="layers" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Map Objects</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onToggleAnnotations} className="text-xs">
                  {hideAnnotations ? "Show All" : "Hide All"}
                </Button>
                {objects.filter((obj) => obj.completed).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete all objects?")) {
                        objects
                          .filter((obj) => obj.completed)
                          .forEach((obj) => {
                            onDeleteObject(obj.id)
                          })
                      }
                    }}
                    className="text-xs text-red-600"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {objects
                .filter((obj) => obj.completed)
                .map((object) => (
                  <div
                    key={object.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getObjectIcon(object)}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate cursor-pointer"
                          onClick={() => onFocusLayer(object.id)}
                        >
                          {object.name || "Unnamed"}
                        </p>
                        {object.desc && <p className="text-xs text-gray-500 truncate">{object.desc}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteObject(object.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              {objects.filter((obj) => obj.completed).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No objects yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="p-4 space-y-4">
            {currentUser && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <Image
                      src={currentUser.photoURL || "/placeholder.svg"}
                      alt="User avatar"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {currentUser.displayName?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{currentUser.displayName || "Anonymous"}</p>
                    <p className="text-sm text-gray-600 truncate">{currentUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            {mapDetails && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={mapDetails.type === "private" ? "destructive" : "secondary"}>
                    {mapDetails.type === "private" ? (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-gray-600">{users.filter((u) => u.active).length} active</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="flex items-center gap-2">
                  {isBroadcastingCursor ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show my cursor
                </Label>
                <Switch
                  checked={isBroadcastingCursor}
                  onCheckedChange={(checked) => {
                    setIsBroadcastingCursor(checked)
                    onToggleCursorBroadcast(checked)
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Location tracking
                </Label>
                <Switch checked={isLocationTracking} onCheckedChange={onToggleLocationTracking} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Active Users</h3>
              {users
                .filter((u) => u.active && u.id !== currentUser?.uid)
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                      <span className="text-sm">{user.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("toggleUserCursor", {
                            detail: { userId: user.id, show: true },
                          }),
                        )
                      }}
                      className="text-xs"
                    >
                      Watch
                    </Button>
                  </div>
                ))}
              {users.filter((u) => u.active && u.id !== currentUser?.uid).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No other users online</p>
              )}
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent("openCreateGroup"))}
                className="w-full"
                variant="outline"
              >
                <Users className="w-4 h-4 mr-2" />
                Create Group
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => window.dispatchEvent(new CustomEvent("openGroupManagement"))}
                  className="w-full"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Group
                </Button>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <div className="p-4 border-t border-gray-200">
        {currentUser && (
          <Button onClick={onLogout} className="w-full bg-red-500 hover:bg-red-600 text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        )}
        <p className="text-xs text-gray-500 text-center mt-2">
          ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>{" "}
          contributors
        </p>
      </div>
    </div>
  )
}
