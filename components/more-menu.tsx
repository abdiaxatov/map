"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface MoreMenuProps {
  onExportGeoJSON: () => void
  onLogout: () => void
  onClose: () => void
}

export function MoreMenu({ onExportGeoJSON, onLogout, onClose }: MoreMenuProps) {
  return (
    <DropdownMenu onOpenChange={(open) => !open && onClose()}>
      <DropdownMenuTrigger asChild>
        <Button id="more-vertical" variant="ghost" size="icon" className="absolute right-3 top-3.5 h-auto w-auto p-0">
          <MoreVertical className="h-5 w-5 text-gray-500 hover:opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="absolute right-0 top-0 z-[100] mt-2 w-48 rounded-md border border-gray-200 bg-white p-0 shadow-lg"
      >
        <DropdownMenuItem
          className="more-item cursor-pointer rounded-t-md border-b border-gray-200 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
          onClick={onExportGeoJSON}
        >
          Export to GeoJSON
        </DropdownMenuItem>
        <DropdownMenuItem
          className="more-item cursor-pointer px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
          onSelect={(e) => e.preventDefault()} // Prevent closing dropdown on link click
        >
          <a
            href="https://github.com/alyssaxuu/mapus"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            GitHub repo
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="more-item cursor-pointer rounded-b-md px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
          onClick={onLogout}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
