"use client"
import type { LucideIcon } from "lucide-react"

interface ToolButtonProps {
  id: string
  icon: LucideIcon
  label: string
  shortcut?: string
  isActive?: boolean
  onClick: () => void
}

export function ToolButton({ id, icon: Icon, label, shortcut, isActive = false, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-10 h-10 rounded-lg flex items-center justify-center
        transition-all duration-200 ease-out group
        ${
          isActive
            ? "bg-blue-500 text-white shadow-lg scale-105"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }
      `}
      title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
    >
      <Icon className="w-4 h-4" />
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
      )}
    </button>
  )
}
