"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, Trash, MapPin, Ruler, Square, Users, Eye, EyeOff, LogOut, Navigation } from "lucide-react" // Trash iconi qo'shildi
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { MapObject, UserCursor, RoomDetails } from "@/hooks/use-map-data"
import { Button } from "@/components/ui/button"
import type { User } from "firebase/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Lock, Globe } from "lucide-react"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  currentUserData: UserCursor | undefined // Yangi prop
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
  currentUserData, // Propdan foydalanamiz
}: AppSidebarProps) {
  const [editingName, setEditingName] = React.useState(false)
  const [editingDescription, setEditingDescription] = React.useState(false)
  const [currentMapName, setCurrentMapName] = React.useState(mapName)
  const [currentMapDescription, setCurrentMapDescription] = React.useState(mapDescription)
  // isBroadcastingCursor ni currentUserData dan olamiz, agar mavjud bo'lmasa true
  const [isBroadcastingCursor, setIsBroadcastingCursor] = React.useState(currentUserData?.isBroadcastingCursor ?? true)

  React.useEffect(() => {
    setCurrentMapName(mapName)
  }, [mapName])

  React.useEffect(() => {
    setCurrentMapDescription(mapDescription)
  }, [mapDescription])

  // currentUserData o'zgarganda isBroadcastingCursor ni yangilaymiz
  React.useEffect(() => {
    setIsBroadcastingCursor(currentUserData?.isBroadcastingCursor ?? true)
  }, [currentUserData])

  const handleNameBlur = () => {
    setEditingName(false)
    onUpdateMapName(currentMapName)
  }

  const handleDescriptionBlur = () => {
    setEditingDescription(false)
    onUpdateMapDescription(currentMapDescription)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (editingName) handleNameBlur()
      if (editingDescription) handleDescriptionBlur()
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

  const getAnnotationIcon = (object: MapObject) => {
    switch (object.type) {
      case "line":
      case "draw":
        return (
          <svg
            className="annotation-icon"
            width="23"
            height="23"
            viewBox="0 0 23 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="23" height="23" rx="5" fill={object.color} />
            <path d="M14.5 8.5L8.5 14.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" />
            <path
              d="M15.8108 8.53378C16.7176 8.53378 17.4527 7.79868 17.4527 6.89189C17.4527 5.98510 16.7176 5.25 15.8108 5.25C14.9040 5.25 14.1689 5.98510 14.1689 6.89189C14.1689 7.79868 14.9040 8.53378 15.8108 8.53378Z"
              stroke="white"
              strokeWidth="1.5"
            />
            <circle cx="6.89189" cy="15.8108" r="1.64189" stroke="white" strokeWidth="1.5" />
          </svg>
        )
      case "area":
        return (
          <svg
            className="annotation-icon"
            width="23"
            height="23"
            viewBox="0 0 23 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="23" height="23" rx="5" fill={object.color} />
            <path d="M15.3652 8.5V13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8.5 15.3649H13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M14.5303 9.03033C14.8232 8.73744 14.8232 8.26256 14.5303 7.96967C14.2374 7.67678 13.7626 7.67678 13.4697 7.96967L14.5303 9.03033ZM7.96967 13.4697C7.67678 13.7626 7.67678 14.2374 7.96967 14.5303C8.26256 14.8232 8.73744 14.8232 9.03033 14.5303L7.96967 13.4697L9.03033 14.5303L14.5303 9.03033L13.4697 7.96967Z"
              fill="white"
            />
            <circle cx="15.365" cy="6.85135" r="1.60135" stroke="white" strokeWidth="1.5" />
            <circle cx="15.365" cy="15.3649" r="1.60135" stroke="white" strokeWidth="1.5" />
            <circle cx="6.85135" cy="15.3649" r="1.60135" stroke="white" strokeWidth="1.5" />
          </svg>
        )
      case "marker":
        return (
          <svg
            className="annotation-icon"
            width="23"
            height="23"
            viewBox="0 0 23 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="23" height="23" rx="5" fill={object.color} />
            <path
              d="M16.0252 11.2709C16.0252 14.8438 11.3002 17.9063 11.3002 17.9063C11.3002 17.9063 11.3002 14.8438 6.5752 11.2709C6.5752 10.0525 7.07301 8.8841 7.95912 8.0226C8.84522 7.16111 10.047 6.67712 11.3002 6.67712C12.5533 6.67712 13.7552 7.16111 14.6413 8.0226C15.5274 8.8841 16.0252 10.0525 16.0252 11.2709Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.2996 12.8021C12.1695 12.8021 12.8746 12.1166 12.8746 11.2709C12.8746 10.4252 12.1695 9.73962 11.2996 9.73962C10.4298 9.73962 9.72461 10.4252 9.72461 11.2709C9.72461 12.1166 10.4298 12.8021 11.2996 12.8021Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )
      default:
        return <MapPin className="annotation-icon h-[23px] w-[23px]" />
    }
  }

  const handleToggleMyCursor = (checked: boolean) => {
    setIsBroadcastingCursor(checked)
    onToggleCursorBroadcast(checked)
  }

  const isAdmin = currentUser && mapDetails && mapDetails.admin === currentUser.uid

  // Masofa hisoblash funksiyasi
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in kilometers
    return d
  }

  // currentUserData propidan foydalanamiz
  const otherActiveUsersWithLocation = users.filter((u) => u.id !== currentUser?.uid && u.active && u.realLocation)

  return (
    <Sidebar className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 shadow-sm">
      {/* Xarita tafsilotlari (Yuqori qism) */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div id="map-details" className="relative space-y-3">
          {editingName ? (
            <Input
              id="map-name"
              value={currentMapName}
              onChange={(e) => setCurrentMapName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleKeyDown}
              className="map-editing text-xl font-bold text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 h-auto p-2 border border-slate-300 rounded-md"
              autoFocus
            />
          ) : (
            <div
              className="text-xl font-bold text-slate-800 p-2 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
              onClick={() => setEditingName(true)}
            >
              {currentMapName}
            </div>
          )}
          {editingDescription ? (
            <Textarea
              id="map-description"
              value={currentMapDescription}
              onChange={(e) => setCurrentMapDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              onKeyDown={handleKeyDown}
              className="map-editing text-sm text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 p-2 border border-slate-300 rounded-md resize-none"
              autoFocus
              rows={2}
            />
          ) : (
            <div
              className="text-sm text-slate-600 p-2 rounded-md hover:bg-slate-100 cursor-pointer transition-colors min-h-[2.5rem] flex items-center"
              onClick={() => setEditingDescription(true)}
            >
              {currentMapDescription || "Tavsif qo'shing..."}
            </div>
          )}
        </div>
      </div>

      {/* Tablar (Xarita va Guruh) */}
      <Tabs defaultValue="map" className="flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-2 h-14 rounded-none border-b border-slate-200 bg-slate-50/50 backdrop-blur-sm">
          <TabsTrigger value="map" className="rounded-lg mx-2 text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
            🗺️ Xarita
          </TabsTrigger>
          <TabsTrigger value="group" className="rounded-lg mx-2 text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
            👥 Guruh
          </TabsTrigger>
        </TabsList>

        {/* Tab kontentlari uchun scrollable area */}
        <ScrollArea className="flex-1">
          <TabsContent value="map" className="h-full flex flex-col p-6">
            <div id="annotations-section" className="relative flex-1">
              <div
                id="annotations-header"
                className="sticky top-0 z-10 flex items-center justify-between bg-white py-4 -mx-6 px-6 border-b border-slate-100"
              >
                <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Qatlamlar
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    onClick={onToggleAnnotations}
                  >
                    {hideAnnotations ? (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Ko'rsatish
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Yashirish
                      </>
                    )}
                  </Button>
                  {objects.filter((obj) => obj.completed).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Barcha qatlamlarni o'chirishni xohlaysizmi?")) {
                          objects
                            .filter((obj) => obj.completed)
                            .forEach((obj) => {
                              onDeleteObject(obj.id)
                            })
                        }
                      }}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Tozalash
                    </Button>
                  )}
                </div>
              </div>
              <div id="annotations-list" className="w-full mt-4 space-y-2">
                {objects
                  .filter((obj) => obj.completed)
                  .map((object) => (
                    <Collapsible key={object.id} className="group/collapsible">
                      <div className="annotation-item group/menu-item relative bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                        <CollapsibleTrigger asChild>
                          <div className="p-4 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
                            <div className="flex items-center justify-between w-full">
                              <div className="annotation-name flex items-center flex-1">
                                <ChevronDown className="annotation-arrow mr-3 h-4 w-4 text-slate-400 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                <div className="mr-3">{getAnnotationIcon(object)}</div>
                                <div className="flex-1 min-w-0">
                                  <span
                                    className="block text-sm font-semibold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors truncate"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onFocusLayer(object.id)
                                    }}
                                  >
                                    {object.name}
                                  </span>
                                  <span className="text-xs text-slate-500 block mt-1">
                                    {users.find((u) => u.id === object.user)?.name || "Anonim"}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/menu-item:opacity-100 transition-all"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteObject(object.id)
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="annotation-details px-4 pb-4 border-t border-slate-100 bg-slate-50/30">
                            {object.desc && (
                              <div className="annotation-description text-slate-600 mb-3 pt-3 text-sm leading-relaxed bg-white p-3 rounded-md border border-slate-100">
                                {object.desc}
                              </div>
                            )}
                            <div className="annotation-data pt-3 flex flex-wrap gap-2">
                              {object.type === "marker" && object.lat && object.lng && (
                                <div className="annotation-data-field inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  <MapPin className="mr-1 h-3 w-3" />
                                  {object.lat.toFixed(5)}, {object.lng.toFixed(5)}
                                </div>
                              )}
                              {(object.type === "line" || object.type === "draw") && object.distance !== undefined && (
                                <div className="annotation-data-field inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  <Ruler className="mr-1 h-3 w-3" />
                                  {object.distance} km
                                </div>
                              )}
                              {object.type === "area" && object.area !== undefined && (
                                <div className="annotation-data-field inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                  <Square className="mr-1 h-3 w-3" />
                                  {object.area} km²
                                </div>
                              )}
                              {object.type === "area" && object.distance !== undefined && (
                                <div className="annotation-data-field inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                  <Ruler className="mr-1 h-3 w-3" />
                                  {object.distance} km
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="group" className="h-full flex flex-col p-6">
            {currentUser && (
              <div className="mb-6 p-5 border-2 border-slate-200 rounded-xl flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
                {currentUser.photoURL ? (
                  <Image
                    src={currentUser.photoURL || "/placeholder.svg"}
                    alt={currentUser.displayName || "User avatar"}
                    width={56}
                    height={56}
                    className="rounded-full border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {currentUser.displayName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-xl text-slate-800">{currentUser.displayName || "Anonim foydalanuvchi"}</p>
                  <p className="text-sm text-slate-600 mt-1">{currentUser.email}</p>
                </div>
              </div>
            )}

            {mapDetails && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{mapDetails.name}</h3>
                  <Badge variant={mapDetails.type === "private" ? "destructive" : "secondary"}>
                    {mapDetails.type === "private" ? (
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
                <p className="text-sm text-gray-600">{mapDetails.description || "Tavsif yo'q"}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Jami a'zolar: {mapDetails.members ? Object.keys(mapDetails.members).length : 0}</span>
                  <span>Faol: {users.filter((u) => u.active).length}</span>
                </div>
              </div>
            )}

            {/* Guruh yaratish va boshqarish tugmalari */}
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => {
                  const event = new CustomEvent("openCreateGroup")
                  window.dispatchEvent(event)
                }}
                className="w-full flex items-center justify-center gap-2 h-10 bg-black text-white hover:bg-gray-800"
              >
                <Users className="h-4 w-4" />
                Yangi guruh yaratish
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => {
                    const event = new CustomEvent("openGroupManagement")
                    window.dispatchEvent(event)
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <Users className="h-4 w-4" />
                  Guruhni boshqarish
                </Button>
              )}
            </div>

            {/* Kursor va Joylashuvni kuzatish sozlamalari */}
            {currentUser && (
              <div className="mt-6 space-y-4">
                <div className="p-4 border-2 border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors bg-white">
                  <Label htmlFor="cursor-broadcast" className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer">
                    <div className={`p-2 rounded-full ${isBroadcastingCursor ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {isBroadcastingCursor ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <span>Kursorimni ko'rsatish</span>
                  </Label>
                  <Switch
                    id="cursor-broadcast"
                    checked={isBroadcastingCursor}
                    onCheckedChange={handleToggleMyCursor}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="p-4 border-2 border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors bg-white">
                  <Label htmlFor="location-tracking" className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer">
                    <div className={`p-2 rounded-full ${isLocationTracking ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Navigation className="h-4 w-4" />
                    </div>
                    <span>Joylashuvni kuzatish</span>
                  </Label>
                  <Switch
                    id="location-tracking"
                    checked={isLocationTracking}
                    onCheckedChange={onToggleLocationTracking}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                {isLocationTracking && currentUserData?.realLocation && (
                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Joriy joylashuvim</span>
                    </div>
                    <div className="text-xs text-gray-600 pl-6">
                      <div>Lat: {currentUserData.realLocation.lat.toFixed(6)}</div>
                      <div>Lng: {currentUserData.realLocation.lng.toFixed(6)}</div>
                      <div className="text-gray-500">
                        Oxirgi yangilanish: {new Date(currentUserData.realLocation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}

                {isLocationTracking && currentUserData?.realLocation && otherActiveUsersWithLocation.length > 0 && (
                  <Collapsible className="group/collapsible">
                    <div className="p-3 border rounded-lg">
                      <CollapsibleTrigger asChild className="w-full justify-start">
                        <SidebarMenuButton>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Masofalar ({otherActiveUsersWithLocation.length})
                              </span>
                            </div>
                            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-2">
                        {otherActiveUsersWithLocation.map((user) => {
                          if (!user.realLocation || !currentUserData.realLocation) return null

                          const distance = calculateDistance(
                            currentUserData.realLocation.lat,
                            currentUserData.realLocation.lng,
                            user.realLocation.lat,
                            user.realLocation.lng,
                          )

                          return (
                            <div key={user.id} className="flex items-center justify-between text-sm pl-6">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                                <span>{user.name}</span>
                              </div>
                              <span className="text-gray-600">
                                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                              </span>
                            </div>
                          )
                        })}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
              </div>
            )}

            {/* Faol foydalanuvchilar ro'yxati */}
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">Faol foydalanuvchilar</div>
              <div className="space-y-1">
                {users
                  .filter((u) => u.active && u.id !== currentUser?.uid)
                  .map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
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
                        className="h-6 px-2 text-xs"
                      >
                        Kuzatish
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
    </Tabs>
    {/* Chiqish tugmasi va Attribution (eng pastda fiksirlangan) */}
    <div className="p-6 border-t border-slate-200 bg-gradient-to-t from-slate-50 to-white">
        {currentUser && (
          <Button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 h-12 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 mb-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            <LogOut className="h-5 w-5" />
            Chiqish
          </Button>
        )}
        <div id="attribution" className="text-xs font-medium text-slate-500 text-center bg-white p-2 rounded-lg border border-slate-200">
          ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
            OpenStreetMap
          </a>{" "}
          contributors
        </div>
      </div>
    </Sidebar>
  )
}