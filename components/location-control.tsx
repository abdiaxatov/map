"use client"

import { MapPin } from "lucide-react"

export function LocationControl() {
  // The actual logic for targeting live location is handled in MapComponent
  return (
    <div
      id="location-control"
      className="absolute bottom-[106px] right-[11px] z-[30] flex h-[45px] w-[45px] cursor-pointer items-center justify-center rounded-md bg-white shadow-md hover:bg-gray-50"
    >
      <MapPin className="h-6 w-6 text-gray-600" />
    </div>
  )
}
