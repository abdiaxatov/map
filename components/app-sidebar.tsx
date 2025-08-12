"use client"

import * as React from "react"
import {
  Sidebar, // Asosiy Sidebar konteyneri
  SidebarMenuButton,
} from "@/components/ui/sidebar" // Faqat kerakli komponentlarni import qilamiz
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
    <Sidebar className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Xarita tafsilotlari (Yuqori qism) */}
      <div className="p-4 border-b border-gray-200">
        <div id="map-details" className="relative">
          {editingName ? (
            <Input
              id="map-name"
              value={currentMapName}
              onChange={(e) => setCurrentMapName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleKeyDown}
              className="map-editing text-lg font-semibold text-black focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 border-none"
              autoFocus
            />
          ) : (
            <Input
              id="map-name"
              value={currentMapName}
              disabled
              className="text-lg font-semibold text-black h-auto p-0 border-none"
              onMouseDown={() => setEditingName(true)}
            />
          )}
          {editingDescription ? (
            <Textarea
              id="map-description"
              value={currentMapDescription}
              onChange={(e) => setCurrentMapDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              onKeyDown={handleKeyDown}
              className="map-editing mt-1 text-sm font-medium text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 border-none resize-none"
              autoFocus
              rows={2}
            />
          ) : (
            <Textarea
              id="map-description"
              value={currentMapDescription}
              disabled
              className="mt-1 text-sm font-medium text-gray-600 h-auto p-0 border-none resize-none"
              onMouseDown={() => setEditingDescription(true)}
              rows={2}
            />
          )}
        </div>
      </div>

      {/* Tablar (Xarita va Guruh) */}
      <Tabs defaultValue="map" className="flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-2 h-12 rounded-none border-b border-gray-200 bg-white">
          <TabsTrigger value="map" className="rounded-none text-base font-medium">
            Xarita
          </TabsTrigger>
          <TabsTrigger value="group" className="rounded-none text-base font-medium">
            Guruh
          </TabsTrigger>
        </TabsList>

        {/* Tab kontentlari uchun scrollable area */}
        <ScrollArea className="flex-1">
          <TabsContent value="map" className="h-full flex flex-col p-4">
            <div id="annotations-section" className="relative flex-1">
              <div
                id="annotations-header"
                className="sticky top-0 z-10 flex items-center justify-between bg-white py-2 -mx-4 px-4"
              >
                <div className="text-sm font-semibold text-black">Qatlamlar</div>
                <div className="flex items-center gap-2">
                  <div
                    id="hide-annotations"
                    className="cursor-pointer text-sm font-medium text-gray-600 hover:opacity-60"
                    onClick={onToggleAnnotations}
                  >
                    {hideAnnotations ? "Hammasini ko'rsatish" : "Hammasini yashirish"}
                  </div>
                  {objects.filter((obj) => obj.completed).length > 0 && (
                    <div
                      id="delete-all-annotations"
                      className="cursor-pointer text-sm font-medium text-red-600 hover:opacity-60"
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
                      Hammasini o'chirish
                    </div>
                  )}
                </div>
              </div>
              <div id="annotations-list" className="w-full mt-2">
                {objects
                  .filter((obj) => obj.completed)
                  .map((object) => (
                    <Collapsible key={object.id} className="group/collapsible">
                      <div className="annotation-item group/menu-item relative py-2 px-0">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton asChild className="w-full justify-start">
                            <div className="flex items-center justify-between w-full">
                              <div className="annotation-name flex items-center">
                                <ChevronDown className="annotation-arrow mr-2 h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                {getAnnotationIcon(object)}
                                <span
                                  className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-black cursor-pointer"
                                  onClick={() => onFocusLayer(object.id)}
                                >
                                  {object.name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mr-2">
                                {users.find((u) => u.id === object.createdBy)?.name || "Anonim"}
                              </div>
                              <Trash // Plus o'rniga Trash iconi
                                className="delete-layer h-4 w-4 cursor-pointer text-gray-500 opacity-0 transition-opacity duration-200 group-hover/menu-item:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteObject(object.id)
                                }}
                              />
                            </div>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="annotation-details ml-[43px] pb-1 text-xs">
                            {object.desc && (
                              <div className="annotation-description text-gray-600 mb-1">{object.desc}</div>
                            )}
                            <div className="annotation-data text-gray-600">
                              {object.type === "marker" && object.lat && object.lng && (
                                <div className="annotation-data-field inline-flex items-center mr-2">
                                  <MapPin className="mr-1 h-3 w-3" />
                                  {object.lat.toFixed(5)}, {object.lng.toFixed(5)}
                                </div>
                              )}
                              {(object.type === "line" || object.type === "draw") && object.distance !== undefined && (
                                <div className="annotation-data-field inline-flex items-center mr-2">
                                  <Ruler className="mr-1 h-3 w-3" />
                                  {object.distance} km
                                </div>
                              )}
                              {object.type === "area" && object.area !== undefined && (
                                <div className="annotation-data-field inline-flex items-center mr-2">
                                  <Square className="mr-1 h-3 w-3" />
                                  {object.area} km&sup2;
                                </div>
                              )}
                              {object.type === "area" && object.distance !== undefined && (
                                <div className="annotation-data-field inline-flex items-center">
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

          <TabsContent value="group" className="h-full flex flex-col p-4">
            {currentUser && (
              <div className="mb-6 p-4 border rounded-lg flex items-center gap-4 bg-gray-50">
                {currentUser.photoURL ? (
                  <Image
                    src={currentUser.photoURL || "/placeholder.svg"}
                    alt={currentUser.displayName || "User avatar"}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-semibold">
                    {currentUser.displayName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg">{currentUser.displayName || "Anonim foydalanuvchi"}</p>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
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
              <div className="mt-4 space-y-2">
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <Label htmlFor="cursor-broadcast" className="flex items-center gap-2 text-sm font-medium">
                    {isBroadcastingCursor ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Kursorimni ko'rsatish
                  </Label>
                  <Switch id="cursor-broadcast" checked={isBroadcastingCursor} onCheckedChange={handleToggleMyCursor} />
                </div>

                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <Label htmlFor="location-tracking" className="flex items-center gap-2 text-sm font-medium">
                    <Navigation className="h-4 w-4" />
                    Joylashuvni kuzatish
                  </Label>
                  <Switch
                    id="location-tracking"
                    checked={isLocationTracking}
                    onCheckedChange={onToggleLocationTracking}
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
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton asChild className="w-full justify-start">
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
      <div className="p-4 border-t border-gray-200">
        {currentUser && (
          <Button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 h-10 bg-red-500 text-white hover:bg-red-600 mb-2"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </Button>
        )}
        <div id="attribution" className="text-xs font-medium text-gray-600 text-center">
          ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>{" "}
          contributors
        </div>
      </div>
    </Sidebar>
  )
}
