"use client"

import { useState, useEffect, useRef } from "react"
import { ref, onValue, off, update, push, remove, get, set, onDisconnect, type Database } from "firebase/database"
import { getFirebaseDatabase } from "@/lib/firebase"
import type { User } from "firebase/auth"

export interface UserCursor {
  id: string
  lat: number
  lng: number
  active: boolean
  color: string
  session: number
  name: string
  imgsrc: string | null
  view: [number, number]
  zoom: number
  realLocation?: {
    lat: number
    lng: number
    timestamp: number
  }
  isBroadcastingCursor?: boolean
  cursorShapeIndex?: number // Yangi: kursor shakli indeksi
}

export interface MapObject {
  id: string
  user: string
  color: string
  type: "draw" | "line" | "area" | "marker"
  session: number
  name: string
  desc: string
  completed: boolean
  initlat?: number
  initlng?: number
  lat?: number
  lng?: number
  m_type?: string
  distance?: number
  area?: number
  path?: [number, number][]
  coords?: { [key: string]: { set: [number, number] } }
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  userColor: string
  message: string
  timestamp: number
  type: "group" | "private"
  targetUserId?: string
  targetUserName?: string
  sticker?: string // Yangi: stikerlar uchun
  replyToMessageId?: string
  replyToMessageContent?: string
  edited?: boolean
}

export interface RoomDetails {
  name: string
  description: string
  type: "public" | "private"
  admin: string
  members: { [userId: string]: boolean }
  createdAt: number
}

const initialLat = 51.52
const initialLon = -0.09
const initialZoom = 13

export function useMapData(roomId: string | null, currentUser: User | null) {
  const [mapDetails, setMapDetails] = useState<RoomDetails | null>(null)
  const [users, setUsers] = useState<UserCursor[]>([])
  const [objects, setObjects] = useState<MapObject[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentSession, setCurrentSession] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [databaseInstance, setDatabaseInstance] = useState<Database | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean>(false)

  const currentUserRef = useRef<User | null>(null)
  currentUserRef.current = currentUser

  const currentRoomIdRef = useRef<string | null>(null)
  currentRoomIdRef.current = roomId

  // Ref to hold the latest users state for comparison in onValue listener
  const usersStateRef = useRef<UserCursor[]>([])
  usersStateRef.current = users

  // Effect to initialize the Firebase Database instance once
  useEffect(() => {
    try {
      const db = getFirebaseDatabase()
      setDatabaseInstance(db)
    } catch (error) {
      console.error("Failed to get Firebase Database instance during initialization:", error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!roomId || !databaseInstance) {
      setLoading(false)
      return
    }

    setLoading(true)
    currentRoomIdRef.current = roomId

    const detailsRef = ref(databaseInstance, `rooms/${roomId}/details`)
    const usersRef = ref(databaseInstance, `rooms/${roomId}/users`)
    const objectsRef = ref(databaseInstance, `rooms/${roomId}/objects`)
    const messagesRef = ref(databaseInstance, `rooms/${roomId}/chat/messages`)

    // Listen for map details changes
    const unsubscribeDetails = onValue(detailsRef, (snapshot) => {
      const details = snapshot.val()
      setMapDetails(details)

      // Access control check
      if (details) {
        const isPublic = details.type === "public"
        const isMember = details.members && currentUser && details.members[currentUser.uid]
        const isAdmin = currentUser && details.admin === currentUser.uid

        if (!currentUser) {
          setHasAccess(isPublic)
        } else {
          setHasAccess(isPublic || isMember || isAdmin)
        }
      } else {
        setHasAccess(false)
      }
    })

    // Fetch initial session for current user and set active status
    const setupCurrentUser = async () => {
      if (currentUser) {
        const userRef = ref(databaseInstance, `rooms/${roomId}/users/${currentUser.uid}`)
        const userSnapshot = await get(userRef)
        let session = 1
        let isBroadcastingCursor = true
        let cursorShapeIndex = 0

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val()
          session = (userData.session || 0) + 1
          isBroadcastingCursor = userData.isBroadcastingCursor ?? true
          cursorShapeIndex = userData.cursorShapeIndex ?? Math.floor(Math.random() * 10)
        } else {
          cursorShapeIndex = Math.floor(Math.random() * 10)
        }

        setCurrentSession(session)

        const updates: Partial<UserCursor> = {
          active: true,
          session: session,
          name: currentUser.displayName || "Anonymous",
          imgsrc: currentUser.photoURL || null,
          isBroadcastingCursor: isBroadcastingCursor,
          cursorShapeIndex: cursorShapeIndex,
        }

        if (!userSnapshot.exists() || (userSnapshot.val().lat === 0 && userSnapshot.val().lng === 0)) {
          updates.lat = initialLat
          updates.lng = initialLon
          updates.view = [initialLat, initialLon]
          updates.zoom = initialZoom
        }

        if (!userSnapshot.exists() || !userSnapshot.val().color) {
          updates.color = getRandomColor()
        }

        await update(userRef, updates)

        try {
          onDisconnect(ref(databaseInstance, `rooms/${roomId}/users/${currentUser.uid}/active`)).set(false)
        } catch (e) {
          console.error("Failed to set onDisconnect for user presence:", e)
        }
      }
    }

    if (currentUser) {
      setupCurrentUser()
    } else {
      setCurrentSession(null)
    }

    // Listen for users changes
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const newUsersData: UserCursor[] = []
      snapshot.forEach((childSnapshot) => {
        newUsersData.push({ id: childSnapshot.key!, ...childSnapshot.val() })
      })

      // Sort both arrays by ID for consistent comparison
      newUsersData.sort((a, b) => a.id.localeCompare(b.id))
      const currentUsersSorted = [...usersStateRef.current].sort((a, b) => a.id.localeCompare(b.id))

      // Deep compare to avoid unnecessary re-renders
      if (JSON.stringify(newUsersData) !== JSON.stringify(currentUsersSorted)) {
        setUsers(newUsersData)
      }
    })

    // Listen for objects changes
    const unsubscribeObjects = onValue(objectsRef, (snapshot) => {
      const objectsData: MapObject[] = []
      snapshot.forEach((childSnapshot) => {
        objectsData.push({ id: childSnapshot.key!, ...childSnapshot.val() })
      })
      setObjects(objectsData)
      setLoading(false)
    })

    // Listen for chat messages
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const messagesData: ChatMessage[] = []
      snapshot.forEach((childSnapshot) => {
        messagesData.push({ id: childSnapshot.key!, ...childSnapshot.val() })
      })
      messagesData.sort((a, b) => a.timestamp - b.timestamp)
      setMessages(messagesData)
    })

    return () => {
      off(detailsRef, "value", unsubscribeDetails)
      off(usersRef, "value", unsubscribeUsers)
      off(objectsRef, "value", unsubscribeObjects)
      off(messagesRef, "value", unsubscribeMessages)
      if (currentUser) {
        try {
          onDisconnect(ref(databaseInstance, `rooms/${roomId}/users/${currentUser.uid}/active`)).cancel()
        } catch (e) {
          console.error("Failed to cancel onDisconnect for user presence:", e)
        }
      }
    }
  }, [roomId, currentUser, databaseInstance])

  const updateMapDetails = async (updates: Partial<RoomDetails>) => {
    if (!currentRoomIdRef.current || !databaseInstance || !hasAccess) return
    await update(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/details`), updates)
  }

  const updateCurrentUserLocation = async (lat: number, lng: number, view: [number, number], zoom: number) => {
    if (!currentRoomIdRef.current || !currentUserRef.current || !databaseInstance || !hasAccess) return

    const currentUserData = users.find((u) => u.id === currentUserRef.current?.uid)
    const isBroadcasting = currentUserData?.isBroadcastingCursor ?? true

    if (isBroadcasting) {
      await update(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/users/${currentUserRef.current.uid}`), {
        lat,
        lng,
        view,
        zoom,
      })
    }
  }

  const updateRealLocation = async (lat: number, lng: number) => {
    if (!currentRoomIdRef.current || !currentUserRef.current || !databaseInstance || !hasAccess) return
    await update(
      ref(databaseInstance, `rooms/${currentRoomIdRef.current}/users/${currentUserRef.current.uid}/realLocation`),
      {
        lat,
        lng,
        timestamp: Date.now(),
      },
    )
  }

  const addMapObject = async (newObject: Omit<MapObject, "id" | "user" | "session" | "completed">) => {
    if (
      !currentRoomIdRef.current ||
      !currentUserRef.current ||
      currentSession === null ||
      !databaseInstance ||
      !hasAccess
    )
      return null
    const newObjectRef = push(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/objects`))
    const objectId = newObjectRef.key
    if (objectId) {
      await set(newObjectRef, {
        ...newObject,
        user: currentUserRef.current.uid,
        session: currentSession,
        completed: false,
      })
      return objectId
    }
    return null
  }

  const updateMapObject = async (objectId: string, updates: Partial<MapObject>) => {
    if (!currentRoomIdRef.current || !databaseInstance || !hasAccess) return
    await update(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/objects/${objectId}`), updates)
  }

  const deleteMapObject = async (objectId: string) => {
    if (!currentRoomIdRef.current || !databaseInstance || !hasAccess) return
    await remove(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/objects/${objectId}`))
  }

  const addDrawingCoordinate = async (objectId: string, lat: number, lng: number) => {
    if (!currentRoomIdRef.current || !databaseInstance || !hasAccess) return
    await push(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/objects/${objectId}/coords`), {
      set: [lat, lng],
    })
  }

  const sendMessage = async (
    message: string,
    type: "group" | "private" = "group",
    targetUserId?: string,
    sticker?: string,
    replyToMessageId?: string,
    replyToMessageContent?: string,
  ) => {
    if (!currentRoomIdRef.current || !currentUserRef.current || !databaseInstance || !hasAccess) return

    const targetUser = targetUserId ? users.find((u) => u.id === targetUserId) : null

    const newMessageRef = push(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/chat/messages`))
    await set(newMessageRef, {
      userId: currentUserRef.current.uid,
      userName: currentUserRef.current.displayName || "Anonymous",
      userColor: users.find((u) => u.id === currentUserRef.current!.uid)?.color || "#222222",
      message,
      timestamp: Date.now(),
      type,
      ...(targetUserId && { targetUserId, targetUserName: targetUser?.name || "Unknown" }),
      ...(sticker && { sticker }),
      ...(replyToMessageId && { replyToMessageId, replyToMessageContent }),
      edited: false,
    })
  }

  const editMessage = async (messageId: string, newMessage: string) => {
    if (!currentRoomIdRef.current || !databaseInstance || !hasAccess) return
    await update(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/chat/messages/${messageId}`), {
      message: newMessage,
      edited: true,
    })
  }

  const deleteMessage = async (messageId: string) => {
    if (!currentRoomIdRef.current || !databaseInstance || !hasAccess) return
    await remove(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/chat/messages/${messageId}`))
  }

  const joinRoom = async (roomId: string) => {
    if (!currentUserRef.current || !databaseInstance) return { success: false, reason: "no_user" }

    const roomDetailsRef = ref(databaseInstance, `rooms/${roomId}/details`)
    const roomSnapshot = await get(roomDetailsRef)

    if (!roomSnapshot.exists()) return { success: false, reason: "room_not_found" }

    const roomData = roomSnapshot.val() as RoomDetails

    if (roomData.type === "private" && !roomData.members?.[currentUserRef.current.uid]) {
      return { success: false, reason: "access_required", roomName: roomData.name }
    }

    const userRef = ref(databaseInstance, `rooms/${roomId}/users/${currentUserRef.current.uid}`)
    const userSnapshot = await get(userRef)
    let session = 1
    let isBroadcastingCursor = true
    let cursorShapeIndex = 0

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val()
      session = (userData.session || 0) + 1
      isBroadcastingCursor = userData.isBroadcastingCursor ?? true
      cursorShapeIndex = userData.cursorShapeIndex ?? Math.floor(Math.random() * 10)
    } else {
      cursorShapeIndex = Math.floor(Math.random() * 10)
    }

    const updates: Partial<UserCursor> = {
      active: true,
      session: session,
      name: currentUserRef.current.displayName || "Anonymous",
      imgsrc: currentUserRef.current.photoURL || null,
      isBroadcastingCursor: isBroadcastingCursor,
      cursorShapeIndex: cursorShapeIndex,
    }

    if (!userSnapshot.exists() || (userSnapshot.val().lat === 0 && userSnapshot.val().lng === 0)) {
      updates.lat = initialLat
      updates.lng = initialLon
      updates.view = [initialLat, initialLon]
      updates.zoom = initialZoom
    }

    if (!userSnapshot.exists() || !userSnapshot.val().color) {
      updates.color = getRandomColor()
    }

    await update(userRef, updates)

    if (roomData.type === "public") {
      await update(ref(databaseInstance, `rooms/${roomId}/details/members`), {
        [currentUserRef.current.uid]: true,
      })
    }

    return { success: true }
  }

  const requestRoomAccess = async (roomId: string) => {
    if (!currentUserRef.current || !databaseInstance) return

    await update(ref(databaseInstance, `rooms/${roomId}/pendingRequests/${currentUserRef.current.uid}`), {
      name: currentUserRef.current.displayName || "Anonymous",
      imgsrc: currentUserRef.current.photoURL || null,
      timestamp: Date.now(),
    })
  }

  const approveRoomAccess = async (roomId: string, userId: string) => {
    if (!databaseInstance) return

    await update(ref(databaseInstance, `rooms/${roomId}/details/members`), {
      [userId]: true,
    })

    await remove(ref(databaseInstance, `rooms/${roomId}/pendingRequests/${userId}`))
  }

  const checkAccessStatus = async (roomId: string, userId: string) => {
    if (!databaseInstance) return null

    const pendingRef = ref(databaseInstance, `rooms/${roomId}/pendingRequests/${userId}`)
    const snapshot = await get(pendingRef)

    if (snapshot.exists()) {
      return "pending"
    }

    const memberRef = ref(databaseInstance, `rooms/${roomId}/details/members/${userId}`)
    const memberSnapshot = await get(memberRef)

    if (memberSnapshot.exists()) {
      return "approved"
    }

    return "none"
  }

  const toggleCursorBroadcast = async (broadcast: boolean) => {
    if (!currentRoomIdRef.current || !currentUserRef.current || !databaseInstance) return
    await update(ref(databaseInstance, `rooms/${currentRoomIdRef.current}/users/${currentUserRef.current.uid}`), {
      isBroadcastingCursor: broadcast,
    })
  }

  const getRandomColor = () => {
    const colors = ["#EC1D43", "#EC811D", "#ECBE1D", "#B6EC1D", "#1DA2EC", "#781DEC", "#CF1DEC", "#222222"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const currentUserData = users.find((u) => u.id === currentUser?.uid)

  return {
    mapDetails,
    users,
    objects,
    messages,
    currentSession,
    loading,
    hasAccess,
    updateMapDetails,
    updateCurrentUserLocation,
    updateRealLocation,
    addMapObject,
    updateMapObject,
    deleteMapObject,
    addDrawingCoordinate,
    sendMessage,
    editMessage,
    deleteMessage,
    joinRoom,
    requestRoomAccess,
    approveRoomAccess,
    checkAccessStatus,
    toggleCursorBroadcast,
    currentUserData,
  }
}
