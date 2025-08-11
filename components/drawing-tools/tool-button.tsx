"use client"
import { useState } from "react"
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
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setHoveredTool(id)}
        onMouseLeave={() => setHoveredTool(null)}
        className={`
          relative w-10 h-10 rounded-lg flex items-center justify-center
          transition-all duration-200 ease-out
          ${
            isActive
              ? "bg-blue-500 text-white shadow-lg scale-105"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }
        `}
      >
        <Icon className="w-4 h-4" />
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        )}
      </button>

      {hoveredTool === id && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
          <div className="font-medium">{label}</div>
          {shortcut && <div className="text-gray-400">Press {shortcut}</div>}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
