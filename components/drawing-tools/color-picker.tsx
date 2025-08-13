"use client"
import { useState } from "react"
import { Palette } from "lucide-react"

interface ColorPickerProps {
  drawingColor: string
  onColorChange: (color: string) => void
}

const colors = [
  "#634FF1",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#000000",
  "#FFFFFF",
  "#808080",
  "#FF0000",
  "#00FF00",
  "#0000FF",
]

export function ColorPicker({ drawingColor, onColorChange }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [customColor, setCustomColor] = useState(drawingColor)

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
        title="Colors"
      >
        <div className="relative">
          <Palette className="w-4 h-4 text-gray-600" />
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: drawingColor }}
          />
        </div>
      </button>

      {showPicker && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-64 z-50">
          <div className="grid grid-cols-6 gap-2 mb-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onColorChange(color)
                  setShowPicker(false)
                }}
                className={`
                  w-8 h-8 rounded border-2 transition-all duration-200 hover:scale-110
                  ${drawingColor === color ? "border-gray-800 scale-110" : "border-gray-300"}
                `}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                onColorChange(customColor)
                setShowPicker(false)
              }}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
