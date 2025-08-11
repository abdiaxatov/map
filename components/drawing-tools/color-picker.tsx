"use client"
import { useState } from "react"
import { Palette } from "lucide-react"

interface ColorPickerProps {
  drawingColor: string
  onColorChange: (color: string) => void
}

const predefinedColors = [
  "#FF4444",
  "#FF8800",
  "#FFDD00",
  "#44FF44",
  "#0088FF",
  "#8844FF",
  "#FF44FF",
  "#333333",
  "#FFFFFF",
  "#000000",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
]

export function ColorPicker({ drawingColor, onColorChange }: ColorPickerProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState("#000000")
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    onColorChange(color)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        onMouseEnter={() => setHoveredTool("color")}
        onMouseLeave={() => setHoveredTool(null)}
        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="relative">
          <Palette className="w-4 h-4 text-gray-600" />
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: drawingColor }}
          />
        </div>
      </button>

      {hoveredTool === "color" && !showColorPicker && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
          Colors
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900" />
        </div>
      )}

      {showColorPicker && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl p-3 w-64">
          <div className="grid grid-cols-8 gap-1 mb-3">
            {predefinedColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onColorChange(color)
                  setShowColorPicker(false)
                }}
                className={`
                  w-6 h-6 rounded border-2 transition-all duration-200
                  ${
                    drawingColor === color
                      ? "border-gray-400 scale-110 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:scale-105"
                  }
                `}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                onColorChange(customColor)
                setShowColorPicker(false)
              }}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              Apply
            </button>
          </div>

          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white/95" />
        </div>
      )}
    </div>
  )
}
