"use client"
import { MousePointer2, Pencil, Eraser, MapPin, Square, Circle, Type, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DrawingControlsProps {
  activeTool: string
  onToolChange: (tool: string) => void
  drawingColor: string
  onColorChange: (color: string) => void
  onScreenshot?: () => void
  onExport?: () => void
  onImport?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onClear?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitScreen?: () => void
  onToggleGrid?: () => void
  onLocate?: () => void
}

const tools = [
  { id: "cursor", icon: MousePointer2, label: "Cursor" },
  { id: "marker", icon: MapPin, label: "Marker" },
  { id: "pen", icon: Pencil, label: "Pen" },
  { id: "text", icon: Type, label: "Text" },
  { id: "area", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
]

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

export function DrawingControls({ activeTool, onToolChange, drawingColor, onColorChange }: DrawingControlsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-3">
        <div className="flex items-center gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange(tool.id)}
              className={`w-10 h-10 p-0 ${
                activeTool === tool.id ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-gray-100"
              }`}
              title={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          ))}

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="w-10 h-10 p-0 hover:bg-gray-100" title="Color">
                <div className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: drawingColor }}
                  />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="grid grid-cols-6 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                      drawingColor === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {activeTool !== "cursor" && (
          <div className="mt-2 text-center">
            <div className="inline-block bg-black/75 text-white text-xs px-3 py-1 rounded-full">
              {tools.find((t) => t.id === activeTool)?.label || activeTool} active
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
