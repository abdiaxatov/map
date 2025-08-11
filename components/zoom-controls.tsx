"use client"

import { Plus, Minus } from "lucide-react"

export function ZoomControls() {
  // The actual zoom logic is handled in MapComponent
  return (
    <div
      id="zoom-controls"
      className="noselect absolute bottom-[11px] right-[11px] z-[30] w-[45px] rounded-md bg-white shadow-md"
    >
      <div
        id="zoom-in"
        className="flex h-[45px] cursor-pointer items-center justify-center rounded-t-md border-b border-gray-200 hover:bg-gray-50"
      >
        <Plus className="h-5 w-5 text-gray-600" />
      </div>
      <div
        id="zoom-out"
        className="flex h-[45px] cursor-pointer items-center justify-center rounded-b-md hover:bg-gray-50"
      >
        <Minus className="h-5 w-5 text-gray-600" />
      </div>
    </div>
  )
}
