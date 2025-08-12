"use client"

import { useRef } from "react"
import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useAuth } from "@/hooks/use-auth"
import { useMapData } from "@/hooks/use-map-data"
import { getFirebaseDatabase } from "@/lib/firebase"
import { ref, push, set } from "firebase/database"
import type { UserCursor, MapObject } from "@/hooks/use-map-data"
import type { MapComponentRef } from "@/components/map-component"

import { AppSidebar } from "@/components/app-sidebar"
import { AuthPopup } from "@/components/auth-popup"
import { SharePopup } from "@/components/share-popup"
import { MoreMenu } from "@/components/more-menu"
import { SearchBox } from "@/components/search-box"
import { DrawingControls } from "@/components/drawing-controls"
import { LocationControl } from "@/components/location-control"
import { ZoomControls } from "@/components/zoom-controls"
import { CreateGroupModal } from "@/components/create-group-modal"
import { GroupManagement } from "@/components/group-management"
import { ChatPanel } from "@/components/chat-panel"
import { LocationTracker } from "@/components/location-tracker"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { AccessRequestModal } from "@/components/access-request-modal"
import { AccessDeniedModal } from "@/components/access-denied-modal"
import { AccessWaitingModal } from "@/components/access-waiting-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RightNav } from "@/components/right-nav" // Import RightNav component
import { UserListModal } from "@/components/user-list-modal" // Import UserListModal component

// Dynamically import MapComponent with SSR disabled
const MapComponent = dynamic(() => import("@/components/map-component").then((mod) => mod.MapComponent), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-200">
      <p>Xarita yuklanmoqda...</p>
    </div>
  ),
})

export default function MapPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = searchParams.get("file")

  const { user, loading: authLoading, signInWithGoogle, signInWithGithub, logOut } = useAuth()
  const {
    mapDetails,
    users,
    objects,
    messages,
    currentSession,
    loading: mapDataLoading,
    hasAccess,
    updateMapDetails,
    updateCurrentUserLocation,
    updateRealLocation,
    addMapObject,
    updateMapObject,
    deleteMapObject,
    addDrawingCoordinate,
    sendMessage,
    joinRoom,
    requestRoomAccess,
    approveRoomAccess,
    checkAccessStatus,
    toggleCursorBroadcast,
    currentUserData,
    editMessage,
    deleteMessage,
  } = useMapData(roomId, user)

  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [authPopupMode, setAuthPopupMode] = useState<"signin" | "create">("signin")
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showGroupManagement, setShowGroupManagement] = useState(false)
  const [activeTool, setActiveTool] = useState<
    | "cursor"
    | "pen"
    | "eraser"
    | "marker"
    | "area"
    | "path"
    | "circle"
    | "triangle"
    | "polygon"
    | "star"
    | "heart"
    | "arrow"
    | "text"
    | "brush"
    | "highlighter"
    | "fill"
    | "ruler"
    | "compass"
    | "area-measure"
    | "crosshair"
  >("cursor")
  const [drawingColor, setDrawingColor] = useState("#634FF1")
  const [observingUser, setObservingUser] = useState<UserCursor | null>(null)
  const [hideAnnotations, setHideAnnotations] = useState(false)
  const [showAccessRequest, setShowAccessRequest] = useState(false)
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  const [showAccessWaiting, setShowAccessWaiting] = useState(false)
  const [accessRequestRoomName, setAccessRequestRoomName] = useState("")
  const [isLocationTracking, setIsLocationTracking] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  // const [showChatPanel, setShowChatPanel] = useState(false) // Chat panel endi doimiy ochiq
  const [showUserListModal, setShowUserListModal] = useState(false)

  const mapComponentRef = useRef<MapComponentRef>(null)
  const exportGeoJSONRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (authLoading || mapDataLoading) return

    if (!user) {
      if (roomId) {
        if (mapDetails?.type === "private") {
          setAuthPopupMode("signin")
          setShowAuthPopup(true)
        } else {
          setShowAuthPopup(false)
        }
      } else {
        setAuthPopupMode("create")
        setShowAuthPopup(true)
      }
    } else if (user && roomId && mapDetails) {
      if (mapDetails.type === "private" && !mapDetails.members?.[user.uid] && mapDetails.admin !== user.uid) {
        checkAccessStatus(roomId, user.uid).then((status) => {
          if (status === "none") {
            setAccessRequestRoomName(mapDetails.name)
            setShowAccessRequest(true)
          } else if (status === "pending") {
            setAccessRequestRoomName(mapDetails.name)
            setShowAccessWaiting(true)
          } else if (status === "approved") {
            setShowAuthPopup(false)
          }
        })
      } else {
        setShowAuthPopup(false)
      }
    }
  }, [authLoading, user, roomId, mapDetails, mapDataLoading, hasAccess, checkAccessStatus])

  useEffect(() => {
    if (observingUser) {
      const latestObservedUser = users.find((u) => u.id === observingUser.id)
      if (latestObservedUser) {
        if (
          latestObservedUser.lat !== observingUser.lat ||
          latestObservedUser.lng !== observingUser.lng ||
          latestObservedUser.view[0] !== observingUser.view[0] ||
          latestObservedUser.view[1] !== observingUser.view[1] ||
          latestObservedUser.zoom !== observingUser.zoom
        ) {
          setObservingUser(latestObservedUser)
        }
      } else {
        setObservingUser(null)
      }
    }
  }, [users, observingUser])

  useEffect(() => {
    const handleOpenCreateGroup = () => {
      if (user) {
        setShowCreateGroup(true)
      } else {
        setAuthPopupMode("signin")
        setShowAuthPopup(true)
      }
    }

    const handleOpenGroupManagement = () => {
      if (user) {
        setShowGroupManagement(true)
      } else {
        setAuthPopupMode("signin")
        setShowAuthPopup(true)
      }
    }

    window.addEventListener("openCreateGroup", handleOpenCreateGroup)
    window.addEventListener("openGroupManagement", handleOpenGroupManagement)

    return () => {
      window.removeEventListener("openCreateGroup", handleOpenCreateGroup)
      window.removeEventListener("openGroupManagement", handleOpenGroupManagement)
    }
  }, [user])

  useEffect(() => {
    if (roomId && roomId.startsWith("-")) {
      const validRoomId = roomId.replace(/[^a-zA-Z0-9_-]/g, "")
      if (validRoomId !== roomId) {
        router.replace(`/?file=${validRoomId}`)
      }
    }
  }, [roomId, router])

  const handleSignInGoogle = async () => {
    await signInWithGoogle()
    if (roomId) {
      setShowAuthPopup(false)
    }
  }

  const handleSignInGithub = async () => {
    await signInWithGithub()
    if (roomId) {
      setShowAuthPopup(false)
    }
  }

  const handleCreateMap = async () => {
    setShowAuthPopup(false)
  }

  const handleCreateGroup = async (groupData: {
    name: string
    description: string
    type: "public" | "private"
  }) => {
    if (!user) {
      alert("Guruh yaratish uchun tizimga kiring")
      return
    }

    try {
      const database = getFirebaseDatabase()
      const newRoomRef = push(ref(database, "rooms"))
      const newRoomId = newRoomRef.key

      if (!newRoomId) {
        throw new Error("Guruh ID yaratilmadi")
      }

      const roomData = {
        ...groupData,
        admin: user.uid,
        members: { [user.uid]: true },
        createdAt: Date.now(),
      }

      await set(ref(database, `rooms/${newRoomId}/details`), roomData)

      setShowCreateGroup(false)
      router.push(`/?file=${newRoomId}`)
    } catch (error) {
      console.error("Error creating group:", error)
      alert(`Guruh yaratishda xatolik yuz berdi: ${error}`)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    const result = await joinRoom(roomId)
    if (!result.success && result.reason === "access_required") {
      setAccessRequestRoomName(result.roomName || "Noma'lum guruh")
      setShowAccessRequest(true)
    } else if (!result.success && result.reason === "room_not_found") {
      alert("Guruh topilmadi.")
    } else if (!result.success && result.reason === "no_user") {
      setAuthPopupMode("signin")
      setShowAuthPopup(true)
    }
  }

  const handleLogout = async () => {
    await logOut()
    setShowMoreMenu(false)
    router.push("/")
  }

  const handleExportGeoJSON = () => {
    if (exportGeoJSONRef.current) {
      exportGeoJSONRef.current()
    }
    setShowMoreMenu(false)
  }

  const handleToggleAnnotations = () => {
    setHideAnnotations((prev) => !prev)
  }

  const handleToolChange = (tool: typeof activeTool) => {
    setActiveTool(tool)
  }

  const handleColorChange = (color: string) => {
    setDrawingColor(color)
  }

  const handleObserveUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId)
    if (targetUser && targetUser.id !== user?.uid) {
      setObservingUser(targetUser)
      if (mapComponentRef.current) {
        mapComponentRef.current.panTo(targetUser.lat, targetUser.lng, mapComponentRef.current.getZoom?.() || 13)
      }
    }
  }

  const handleStopObserving = () => {
    setObservingUser(null)
  }

  const handleUpdateMapName = (name: string) => {
    updateMapDetails({ name })
  }

  const handleUpdateMapDescription = (description: string) => {
    updateMapDetails({ description })
  }

  const handleAddMapObject = async (newObject: Omit<MapObject, "id" | "user" | "session" | "completed">) => {
    return await addMapObject(newObject)
  }

  const handleUpdateMapObject = async (objectId: string, updates: Partial<MapObject>) => {
    await updateMapObject(objectId, updates)
  }

  const handleDeleteMapObject = async (objectId: string) => {
    await deleteMapObject(objectId)
  }

  const handleAddDrawingCoordinate = async (objectId: string, lat: number, lng: number) => {
    await addDrawingCoordinate(objectId, lat, lng)
  }

  const handleSearchPanTo = useCallback((lat: number, lng: number, zoom?: number) => {
    console.log("handleSearchPanTo called with:", { lat, lng, zoom })
    console.log("mapComponentRef.current:", mapComponentRef.current)

    if (mapComponentRef.current) {
      console.log("Calling panTo on map component")
      mapComponentRef.current.panTo(lat, lng, zoom)
    } else {
      console.error("Map component ref is null!")
    }
  }, [])

  const handleFocusLayer = useCallback((objectId: string) => {
    if (mapComponentRef.current) {
      mapComponentRef.current.focusLayer(objectId)
    }
  }, [])

  const handleSendMessage = (
    message: string,
    type: "group" | "private" = "group",
    targetUserId?: string,
    sticker?: string,
    replyToMessageId?: string,
    replyToMessageContent?: string,
  ) => {
    sendMessage(message, type, targetUserId, sticker, replyToMessageId, replyToMessageContent)
  }

  const handleEditMessage = async (messageId: string, newMessage: string) => {
    await editMessage(messageId, newMessage)
  }

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId)
  }

  const handleApproveUser = async (userId: string) => {
    if (roomId) {
      await approveRoomAccess(roomId, userId)
    }
  }

  const handleToggleCursorBroadcast = async (broadcast: boolean) => {
    await toggleCursorBroadcast(broadcast)
  }

  const handleToggleLocationTracking = (checked: boolean) => {
    setIsLocationTracking(checked)
  }

  const isAdmin = user && mapDetails && mapDetails.admin === user.uid

  const handleRequestAccess = async () => {
    if (!roomId || !user) return

    try {
      await requestRoomAccess(roomId)
      setShowAccessRequest(false)
      setShowAccessWaiting(true)
    } catch (error) {
      console.error("Error requesting access:", error)
      throw error
    }
  }

  const handleAccessDenied = () => {
    setShowAccessDenied(false)
    router.push("/")
  }

  const handleScreenshot = () => {
    mapComponentRef.current?.takeScreenshot()
  }

  const handleExport = () => {
    mapComponentRef.current?.exportMapData()
  }

  const handleImport = () => {
    mapComponentRef.current?.importMapData()
  }

  const handleUndo = () => {
    // Undo functionality would be implemented here
    console.log("Undo action")
  }

  const handleRedo = () => {
    // Redo functionality would be implemented here
    console.log("Redo action")
  }

  const handleClear = () => {
    // Clear all objects functionality
    if (confirm("Are you sure you want to clear all drawings?")) {
      objects.forEach((obj) => {
        deleteMapObject(obj.id)
      })
    }
  }

  const handleZoomIn = () => {
    mapComponentRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    mapComponentRef.current?.zoomOut()
  }

  const handleFitScreen = () => {
    mapComponentRef.current?.fitToScreen()
  }

  const handleToggleGrid = () => {
    mapComponentRef.current?.toggleGrid()
  }

  const handleLocate = () => {
    mapComponentRef.current?.locateUser()
  }

  if (authLoading || mapDataLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Mapus yuklanmoqda...</div>
  }

  if (!user && roomId && mapDetails?.type === "private") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Kirish cheklangan</h2>
          <p className="text-gray-500">Bu yopiq guruh. Kirish uchun tizimga kiring.</p>
          <Button
            onClick={() => {
              setAuthPopupMode("signin")
              setShowAuthPopup(true)
            }}
            className="mt-4"
          >
            Tizimga kirish
          </Button>
        </div>
        {showAuthPopup && (
          <AuthPopup
            mode={authPopupMode}
            onSignInGoogle={handleSignInGoogle}
            onSignInGithub={handleSignInGithub}
            onCreateMap={handleCreateMap}
          />
        )}
        {showAuthPopup && (
          <div
            className="fixed inset-0 z-[99] bg-black opacity-40"
            onClick={() => {
              setShowAuthPopup(false)
            }}
          />
        )}
      </div>
    )
  }

  if (user && roomId && mapDetails && !hasAccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Ruxsat kutilmoqda...</h2>
          <p className="text-gray-500">Bu yopiq guruhga kirish uchun admin ruxsatini kutishingiz kerak.</p>
        </div>

        {showAccessRequest && (
          <AccessRequestModal
            roomName={accessRequestRoomName}
            onRequestAccess={handleRequestAccess}
            onClose={() => setShowAccessRequest(false)}
          />
        )}

        {showAccessWaiting && (
          <AccessWaitingModal roomName={accessRequestRoomName} onClose={() => setShowAccessWaiting(false)} />
        )}

        {showAccessDenied && <AccessDeniedModal roomName={accessRequestRoomName} onClose={handleAccessDenied} />}

        {(showAccessRequest || showAccessWaiting || showAccessDenied) && (
          <div
            className="fixed inset-0 z-[99] bg-black opacity-40"
            onClick={() => {
              setShowAccessRequest(false)
              setShowAccessWaiting(false)
              setShowAccessDenied(false)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Sidebar Trigger Button (always visible) */}
      <Dialog open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DialogTrigger asChild>
          <Button className="fixed top-4 left-4 z-[50] bg-white text-gray-700 shadow-md" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menyuni ochish</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-none h-full p-0 flex flex-col m-0 rounded-none">
          <DialogHeader>
            <DialogTitle className="sr-only">Menyu</DialogTitle>
          </DialogHeader>
          <AppSidebar
            mapName={mapDetails?.name || "Yuklanmoqda..."}
            mapDescription={mapDetails?.description || "Yuklanmoqda..."}
            onUpdateMapName={handleUpdateMapName}
            onUpdateMapDescription={handleUpdateMapDescription}
            objects={objects}
            onDeleteObject={handleDeleteMapObject}
            onToggleAnnotations={handleToggleAnnotations}
            hideAnnotations={hideAnnotations}
            onFocusLayer={handleFocusLayer}
            users={users}
            currentUser={user}
            mapDetails={mapDetails}
            onToggleCursorBroadcast={handleToggleCursorBroadcast}
            onLogout={handleLogout}
            onToggleLocationTracking={handleToggleLocationTracking}
            isLocationTracking={isLocationTracking}
            currentUserData={currentUserData}
          />
        </DialogContent>
      </Dialog>

      {/* Main Content Area - Map and Chat will now be side-by-side */}
      <main className="relative flex flex-1 h-full w-full">
        <div className="relative flex-1 flex flex-col h-full w-full">
          <MapComponent
            ref={mapComponentRef}
            roomId={roomId}
            currentUser={user}
            currentSession={currentSession}
            users={users}
            objects={objects}
            activeTool={activeTool}
            drawingColor={drawingColor}
            observingUser={observingUser}
            hideAnnotations={hideAnnotations}
            onUpdateCurrentUserLocation={updateCurrentUserLocation}
            onAddMapObject={handleAddMapObject}
            onUpdateMapObject={handleUpdateMapObject}
            onDeleteMapObject={handleDeleteMapObject}
            onAddDrawingCoordinate={handleAddDrawingCoordinate}
            onStopObserving={handleStopObserving}
            exportGeoJSONRef={exportGeoJSONRef}
            hasAccess={hasAccess}
            mapDetails={mapDetails}
            onObserveUser={handleObserveUser}
          />
          <SearchBox onSearchPanTo={handleSearchPanTo} />

          {hasAccess && (
            <DrawingControls
              activeTool={activeTool}
              onToolChange={handleToolChange}
              drawingColor={drawingColor}
              onColorChange={handleColorChange}
              onScreenshot={handleScreenshot}
              onExport={handleExport}
              onImport={handleImport}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitScreen={handleFitScreen}
              onToggleGrid={handleToggleGrid}
              onLocate={handleLocate}
            />
          )}
          <LocationControl />
          <ZoomControls />

          {hasAccess && (
            <LocationTracker
              users={users}
              currentUserId={user?.uid || null}
              onUpdateRealLocation={updateRealLocation}
              isTracking={isLocationTracking}
            />
          )}
        </div>

        {/* Right Nav (Share, MoreMenu, User Avatars) */}
        <RightNav
          users={users}
          currentUser={user}
          onShare={() => setShowSharePopup(true)}
          onObserveUser={handleObserveUser}
          onShowUserListModal={() => setShowUserListModal(true)}
          observingUser={observingUser}
          onStopObserving={handleStopObserving}
        />

        {/* Chat Panel (Always visible on the right) */}
        <div className="relative w-96 h-full border-l border-gray-200 flex flex-col">
          <ChatPanel
            currentUser={user}
            users={users}
            messages={messages}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
          />
        </div>
      </main>

      {showAuthPopup && (
        <AuthPopup
          mode={authPopupMode}
          onSignInGoogle={handleSignInGoogle}
          onSignInGithub={handleSignInGithub}
          onCreateMap={handleCreateMap}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          currentUser={user}
          onCreateGroup={handleCreateGroup}
          onClose={() => {
            setShowCreateGroup(false)
          }}
        />
      )}

      {showGroupManagement && (
        <GroupManagement
          currentUser={user}
          roomId={roomId}
          roomDetails={mapDetails}
          users={users}
          onClose={() => setShowGroupManagement(false)}
          onApproveUser={handleApproveUser}
        />
      )}

      {showSharePopup && (
        <SharePopup
          shareUrl={roomId ? `${window.location.origin}/?file=${roomId}` : "Link mavjud emas"}
          onClose={() => setShowSharePopup(false)}
        />
      )}

      {showMoreMenu && (
        <MoreMenu
          onExportGeoJSON={handleExportGeoJSON}
          onLogout={handleLogout}
          onClose={() => setShowMoreMenu(false)}
        />
      )}

      {showUserListModal && (
        <UserListModal
          users={users}
          currentUser={user}
          onObserveUser={handleObserveUser}
          onClose={() => setShowUserListModal(false)}
        />
      )}

      {(showAuthPopup ||
        showSharePopup ||
        showMoreMenu ||
        showCreateGroup ||
        showGroupManagement ||
        showAccessRequest ||
        showAccessWaiting ||
        showAccessDenied ||
        showUserListModal) && (
        <div
          className="fixed inset-0 z-[99] bg-black opacity-40"
          onClick={() => {
            setShowAuthPopup(false)
            setShowSharePopup(false)
            setShowMoreMenu(false)
            setShowCreateGroup(false)
            setShowGroupManagement(false)
            setShowAccessRequest(false)
            setShowAccessWaiting(false)
            setShowAccessDenied(false)
            // setShowChatPanel(false) // Chat panel endi doimiy ochiq
            setShowUserListModal(false)
          }}
        />
      )}
    </div>
  )
}
