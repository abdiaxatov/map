"use client"
import { useState } from "react"
import {
  MousePointer2,
  Pencil,
  Eraser,
  MapPin,
  Minus,
  Square,
  Camera,
  Download,
  Upload,
  Copy,
  Grid3X3,
  Type,
  Circle,
  Triangle,
  Hexagon,
  Star,
  Heart,
  Undo2,
  Redo2,
  Trash2,
  Ruler,
  Compass,
  Target,
  Crosshair,
  Navigation,
  Settings,
  PaintBucket,
  Brush,
  Highlighter,
  ZoomIn,
  ZoomOut,
  Home,
  Locate,
} from "lucide-react"
import { ColorPicker } from "./drawing-tools/color-picker"
import { ToolButton } from "./drawing-tools/tool-button"

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

const basicTools = [
  { id: "cursor", icon: MousePointer2, label: "Cursor", shortcut: "V" },
  { id: "marker", icon: MapPin, label: "Marker", shortcut: "M" },
  { id: "pen", icon: Pencil, label: "Pen", shortcut: "P" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
]

const drawingTools = [
  { id: "path", icon: Minus, label: "Line", shortcut: "L" },
  { id: "area", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "circle", icon: Circle, label: "Circle", shortcut: "C" },
  { id: "triangle", icon: Triangle, label: "Triangle", shortcut: "T" },
  { id: "polygon", icon: Hexagon, label: "Polygon", shortcut: "G" },
  { id: "star", icon: Star, label: "Star", shortcut: "S" },
  { id: "heart", icon: Heart, label: "Heart", shortcut: "H" },
  { id: "arrow", icon: Navigation, label: "Arrow", shortcut: "W" },
]

const textPaintTools = [
  { id: "text", icon: Type, label: "Text", shortcut: "X" },
  { id: "brush", icon: Brush, label: "Brush", shortcut: "B" },
  { id: "highlighter", icon: Highlighter, label: "Highlighter", shortcut: "I" },
  { id: "fill", icon: PaintBucket, label: "Fill", shortcut: "F" },
]

const measurementTools = [
  { id: "ruler", icon: Ruler, label: "Ruler", shortcut: "U" },
  { id: "compass", icon: Compass, label: "Distance", shortcut: "D" },
  { id: "area-measure", icon: Target, label: "Area", shortcut: "Q" },
  { id: "crosshair", icon: Crosshair, label: "Crosshair", shortcut: "Z" },
]

export function DrawingControls({
  activeTool,
  onToolChange,
  drawingColor,
  onColorChange,
  onScreenshot,
  onExport,
  onImport,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onToggleGrid,
  onLocate,
}: DrawingControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleActionTool = (action: string) => {
    switch (action) {
      case "screenshot":
        onScreenshot?.()
        break
      case "export":
        onExport?.()
        break
      case "import":
        onImport?.()
        break
      case "undo":
        onUndo?.()
        break
      case "redo":
        onRedo?.()
        break
      case "clear":
        onClear?.()
        break
      case "zoom-in":
        onZoomIn?.()
        break
      case "zoom-out":
        onZoomOut?.()
        break
      case "fit-screen":
        onFitScreen?.()
        break
      case "toggle-grid":
        onToggleGrid?.()
        break
      case "locate":
        onLocate?.()
        break
      default:
        console.log(`Action ${action} not implemented`)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-2">
        {/* Basic tools row */}
        <div className="flex items-center gap-1 mb-2">
          {basicTools.map((tool) => (
            <ToolButton
              key={tool.id}
              {...tool}
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Quick actions */}
          <ToolButton id="screenshot" icon={Camera} label="Screenshot" onClick={() => handleActionTool("screenshot")} />
          <ToolButton id="export" icon={Download} label="Export" onClick={() => handleActionTool("export")} />
          <ToolButton id="import" icon={Upload} label="Import" onClick={() => handleActionTool("import")} />

          <ColorPicker drawingColor={drawingColor} onColorChange={onColorChange} />

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
              showAdvanced ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Advanced tools */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-2 space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 w-16">Draw:</span>
              {drawingTools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  {...tool}
                  isActive={activeTool === tool.id}
                  onClick={() => onToolChange(tool.id)}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 w-16">Paint:</span>
              {textPaintTools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  {...tool}
                  isActive={activeTool === tool.id}
                  onClick={() => onToolChange(tool.id)}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 w-16">Measure:</span>
              {measurementTools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  {...tool}
                  isActive={activeTool === tool.id}
                  onClick={() => onToolChange(tool.id)}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 w-16">Edit:</span>
              <ToolButton id="undo" icon={Undo2} label="Undo" onClick={() => handleActionTool("undo")} />
              <ToolButton id="redo" icon={Redo2} label="Redo" onClick={() => handleActionTool("redo")} />
              <ToolButton id="copy" icon={Copy} label="Copy" onClick={() => handleActionTool("copy")} />
              <ToolButton id="clear" icon={Trash2} label="Clear All" onClick={() => handleActionTool("clear")} />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 w-16">View:</span>
              <ToolButton id="zoom-in" icon={ZoomIn} label="Zoom In" onClick={() => handleActionTool("zoom-in")} />
              <ToolButton id="zoom-out" icon={ZoomOut} label="Zoom Out" onClick={() => handleActionTool("zoom-out")} />
              <ToolButton
                id="fit-screen"
                icon={Home}
                label="Fit Screen"
                onClick={() => handleActionTool("fit-screen")}
              />
              <ToolButton id="locate" icon={Locate} label="My Location" onClick={() => handleActionTool("locate")} />
              <ToolButton
                id="grid"
                icon={Grid3X3}
                label="Toggle Grid"
                onClick={() => handleActionTool("toggle-grid")}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tool status */}
      {activeTool !== "cursor" && (
        <div className="mt-2 text-center">
          <div className="inline-block bg-black/75 text-white text-xs px-3 py-1 rounded-full">
            {[...basicTools, ...drawingTools, ...textPaintTools, ...measurementTools].find((t) => t.id === activeTool)
              ?.label || activeTool}{" "}
            mode active
          </div>
        </div>
      )}
    </div>
  )
}
