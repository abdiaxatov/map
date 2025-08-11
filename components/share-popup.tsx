"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface SharePopupProps {
  shareUrl: string
  onClose: () => void
}

export function SharePopup({ shareUrl, onClose }: SharePopupProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div
      id="share"
      className="fixed left-1/2 top-1/2 z-[100] h-[135px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white shadow-lg"
    >
      <div id="share-nav" className="relative flex h-[45px] items-center border-b border-gray-200">
        <span className="ml-5 font-inter text-sm font-semibold text-black">Share Cool Map</span>
        <X
          id="close-share"
          className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer text-gray-500 hover:opacity-60"
          onClick={onClose}
        />
      </div>
      <div className="flex items-center p-5">
        <Input
          id="share-url"
          value={shareUrl}
          readOnly
          className="h-[39px] flex-1 rounded-md border border-gray-200 text-sm font-medium text-gray-600 indent-4 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          id="share-copy"
          className="ml-4 h-[39px] rounded-md bg-black px-5 text-sm font-semibold text-white hover:opacity-60"
          onClick={handleCopyLink}
        >
          Copy link
        </Button>
      </div>
    </div>
  )
}
