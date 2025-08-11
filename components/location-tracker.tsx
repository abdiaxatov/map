"use client"

import { useEffect, useState } from "react"
import type { UserCursor } from "@/hooks/use-map-data"

interface LocationTrackerProps {
  users: UserCursor[]
  currentUserId: string | null
  onUpdateRealLocation: (lat: number, lng: number) => void
  isTracking: boolean // New prop to control tracking state
}

export function LocationTracker({ users, currentUserId, onUpdateRealLocation, isTracking }: LocationTrackerProps) {
  const [watchId, setWatchId] = useState<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.")
      return
    }

    if (isTracking && watchId === null) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          onUpdateRealLocation(latitude, longitude)
        },
        (error) => {
          console.error("Geolocation error:", error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      )
      setWatchId(id)
    } else if (!isTracking && watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [isTracking, watchId, onUpdateRealLocation])

  return null // Bu komponent endi hech narsa render qilmaydi
}
