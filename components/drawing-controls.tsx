"use client"

import type React from "react"

import { useState } from "react"
import { MousePointer2, Pencil, Eraser, MapPin, Minus, Square } from "lucide-react"

interface DrawingControlsProps {
  activeTool: "cursor" | "pen" | "eraser" | "marker" | "area" | "path"
  onToolChange: (tool: "cursor" | "pen" | "eraser" | "marker" | "area" | "path") => void
  drawingColor: string
  onColorChange: (color: string) => void
}

const colors = ["#EC1D43", "#EC811D", "#ECBE1D", "#B6EC1D", "#1DA2EC", "#781DEC", "#CF1DEC", "#222222"]

export function DrawingControls({ activeTool, onToolChange, drawingColor, onColorChange }: DrawingControlsProps) {
  const [showColorList, setShowColorList] = useState(false)
  const [tooltipContent, setTooltipContent] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  const handleMouseEnter = (e: React.MouseEvent, content: string) => {
    setTooltipContent(content)
    setTooltipPosition({
      x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2,
      y: e.currentTarget.offsetTop,
    })
  }

  const handleMouseLeave = () => {
    setTooltipContent(null)
    setTooltipPosition(null)
  }

  return (
    <div
      id="drawing-controls"
      className="noselect absolute bottom-[11px] left-1/2 z-[30] flex h-12 w-[calc(100%-40px)] max-w-fit -translate-x-1/2 transform items-center rounded-md bg-white px-5 shadow-md" // Responsive width
    >
      {[
        { id: "cursor-tool", icon: MousePointer2, tooltip: "Move (V)", tool: "cursor" },
        { id: "pen-tool", icon: Pencil, tooltip: "Pencil (P)", tool: "pen" },
        { id: "eraser-tool", icon: Eraser, tooltip: "Eraser (E)", tool: "eraser" },
        { id: "marker-tool", icon: MapPin, tooltip: "Marker (M)", tool: "marker" },
        { id: "path-tool", icon: Minus, tooltip: "Line (L)", tool: "path" },
        { id: "area-tool", icon: Square, tooltip: "Area (A)", tool: "area" },
      ].map((item) => (
        <div
          key={item.id}
          id={item.id}
          className={`tool group flex h-full items-center justify-center ${activeTool === item.tool ? "tool-active" : ""}`}
          onClick={() => onToolChange(item.tool)}
          onMouseEnter={(e) => handleMouseEnter(e, item.tooltip)}
          onMouseLeave={handleMouseLeave}
        >
          <item.icon className="h-[23px] w-[23px] text-gray-500 opacity-40 transition-opacity duration-100 group-hover:opacity-100" />
        </div>
      ))}

      <div
        id="color-picker"
        className="relative ml-4 h-[25px] w-[25px] cursor-pointer rounded-full border border-gray-200 text-center transition-colors duration-350 hover:border-gray-400"
        onClick={() => setShowColorList(!showColorList)}
      >
        <div
          id="inner-color"
          className="mx-auto mt-[3px] h-[17px] w-[17px] rounded-full"
          style={{ backgroundColor: drawingColor }}
        />
        {showColorList && (
          <div
            id="color-list"
            className="absolute bottom-[calc(100%+10px)] left-1/2 flex h-10 w-fit -translate-x-1/2 transform items-center rounded-md border border-gray-200 bg-white px-2 shadow-md"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            {colors.map((color) => (
              <div
                key={color}
                className="color mx-1 h-5 w-5 cursor-pointer rounded-full"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onColorChange(color)
                  setShowColorList(false)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {tooltipContent && tooltipPosition && (
        <div
          id="tooltip"
          className="absolute z-[9999] rounded-md bg-black px-2 py-1 text-center text-xs font-light text-white"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: "translateX(-50%) translateY(-100%)",
            marginTop: "-15px", // Adjust to position above the icon
          }}
        >
          {tooltipContent}
          <div
            className="arrow-down absolute left-1/2 -translate-x-1/2 border-x-[7px] border-t-[7px] border-x-transparent border-t-black"
            style={{ bottom: "-7px" }}
          />
        </div>
      )}
    </div>
  )
}
