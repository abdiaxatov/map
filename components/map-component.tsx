"use client"

import type React from "react"
import type { User, Session } from "firebase/auth"
import type { UserCursor, MapObject, RoomDetails } from "@/hooks/use-map-data"
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react"
import L from "leaflet"
import "@geoman-io/leaflet-geoman-free"
import { MarkerTool } from "./drawing-tools/marker-tool"
import { PenTool } from "./drawing-tools/pen-tool"
import { ShapeTools } from "./drawing-tools/shape-tools"

import "leaflet/dist/leaflet.css"
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"

if (typeof window !== "undefined") {
  if ((L.Icon.Default.prototype as any)._getIconUrl) {
    delete (L.Icon.Default.prototype as any)._getIconUrl
  }
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

interface MapComponentProps {
  roomId: string | null
  currentUser: User | null
  currentSession: Session | null
  users: UserCursor[]
  objects: MapObject[]
  activeTool:
    | "cursor"
    | "pen"
    | "eraser"
    | "marker"
    | "area"
    | "path"
    | "circle"
    | "triangle"
    | "polygon"
    | "star"
    | "heart"
    | "arrow"
    | "text"
    | "brush"
    | "highlighter"
    | "fill"
    | "ruler"
    | "compass"
    | "area-measure"
    | "crosshair"
  drawingColor: string
  observingUser: UserCursor | null
  hideAnnotations: boolean
  onUpdateCurrentUserLocation: (lat: number, lng: number, view: [number, number], zoom: number) => Promise<void>
  onAddMapObject: (newObject: Omit<MapObject, "id" | "user" | "session" | "completed">) => Promise<string | null>
  onUpdateMapObject: (objectId: string, updates: Partial<MapObject>) => Promise<void>
  onDeleteMapObject: (objectId: string) => Promise<void>
  onAddDrawingCoordinate: (objectId: string, lat: number, lng: number) => Promise<void>
  onStopObserving: () => void
  exportGeoJSONRef: React.MutableRefObject<(() => void) | null>
  hasAccess: boolean
  mapDetails: RoomDetails | null
  onScreenshot?: () => void
  onExport?: () => void
  onImport?: () => void
  onObserveUser?: (userId: string) => void
}

export interface MapComponentRef {
  panTo: (lat: number, lng: number, zoom?: number) => void
  focusLayer: (objectId: string) => void
  takeScreenshot: () => void
  exportMapData: () => void
  importMapData: () => void
  zoomIn: () => void
  zoomOut: () => void
  fitToScreen: () => void
  toggleGrid: () => void
  locateUser: () => void
}

type LeafletMapObject = MapObject & {
  leafletLayer?: L.Layer
  triggerMarker?: L.Marker
}

const initialLat = 51.52
const initialLon = -0.09
const initialZoom = 13

const defaultCursorSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M5.51169 15.8783L1.08855 3.64956C0.511984 2.05552 2.05554 0.511969 3.64957 1.08853L15.8783 5.51168C17.5843 6.12877 17.6534 8.51606 15.9858 9.23072L11.2573 11.2573L9.23074 15.9858C8.51607 17.6534 6.12878 17.5843 5.51169 15.8783Z" fill="currentColor"/></svg>`

export const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(function MapComponent(
  {
    roomId,
    currentUser,
    currentSession,
    users,
    objects,
    activeTool,
    drawingColor,
    observingUser,
    hideAnnotations,
    onUpdateCurrentUserLocation,
    onAddMapObject,
    onUpdateMapObject,
    onDeleteMapObject,
    onAddDrawingCoordinate,
    onStopObserving,
    exportGeoJSONRef,
    hasAccess,
    mapDetails,
    onScreenshot,
    onExport,
    onImport,
    onObserveUser,
  },
  ref,
) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const currentDrawingObjectId = useRef<string | null>(null)
  const isMouseDown = useRef(false)
  const userCursorsRef = useRef<{ [key: string]: L.Marker }>({})
  const userLocationMarkerRef = useRef<L.Marker | null>(null)
  const mapObjectsRef = useRef<LeafletMapObject[]>([])
  const drawingHintMarkerRef = useRef<L.Marker | null>(null)
  const [geomanLoaded, setGeomanLoaded] = useState(false)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [draggedObject, setDraggedObject] = useState<string | null>(null)

  const handleToolComplete = () => {
    // Switch back to cursor tool after completing any drawing action
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("switchToCursor"))
    }
  }

  const markerTool = MarkerTool({
    mapRef,
    drawingColor,
    onAddMapObject,
    onUpdateMapObject,
    onToolComplete: handleToolComplete,
  })

  const penTool = PenTool({
    mapRef,
    drawingColor,
    onAddMapObject,
    onUpdateMapObject,
    onAddDrawingCoordinate,
  })

  const shapeTools = ShapeTools({
    mapRef,
    drawingColor,
    onAddMapObject,
    onUpdateMapObject,
    onToolComplete: handleToolComplete,
  })

  const handleMouseMove = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    const roundedLat = Number.parseFloat(lat.toFixed(5))
    const roundedLng = Number.parseFloat(lng.toFixed(5))

    // Update drawing hint marker position
    if (
      drawingHintMarkerRef.current &&
      (activeTool === "pen" ||
        activeTool === "area" ||
        activeTool === "path" ||
        activeTool === "marker" ||
        activeTool === "text" ||
        activeTool === "circle" ||
        activeTool === "triangle" ||
        activeTool === "polygon")
    ) {
      drawingHintMarkerRef.current.setLatLng([lat, lng])
    }

    if (activeTool === "pen") {
      penTool.handleMouseMove(e)
    }

    // Update current user location
    if (currentUser && currentSession) {
      onUpdateCurrentUserLocation(roundedLat, roundedLng, [roundedLat, roundedLng], mapRef.current?.getZoom() || 0)
    }
  }

  const handleMouseDown = (e: L.LeafletMouseEvent) => {
    if (!currentUser) return

    if (activeTool === "pen") {
      if (mapRef.current) {
        mapRef.current.dragging.disable()
      }
      penTool.handleMouseDown(e)
    }
  }

  const handleMouseUp = () => {
    if (activeTool === "pen") {
      penTool.handleMouseUp()
      if (mapRef.current) {
        mapRef.current.dragging.enable()
      }
    }
  }

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    setSelectedObjectId(null)
    setEditMode(false)

    if (!currentUser) return

    const { lat, lng } = e.latlng
    const roundedLat = Number.parseFloat(lat.toFixed(5))
    const roundedLng = Number.parseFloat(lng.toFixed(5))

    switch (activeTool) {
      case "eraser":
        const clickedObjects = mapObjectsRef.current.filter((obj) => {
          if (obj.leafletLayer) {
            if (obj.leafletLayer instanceof L.Marker) {
              const markerLatLng = obj.leafletLayer.getLatLng()
              const distance = mapRef.current?.distance([roundedLat, roundedLng], [markerLatLng.lat, markerLatLng.lng])
              return distance && distance < 50 // 50 meters tolerance
            } else if (obj.leafletLayer instanceof L.Polyline || obj.leafletLayer instanceof L.Polygon) {
              const bounds = obj.leafletLayer.getBounds()
              return bounds.contains([roundedLat, roundedLng])
            }
          }
          return false
        })

        if (clickedObjects.length > 0) {
          // Delete the first found object (or show selection if multiple)
          const objToDelete = clickedObjects[0]
          if (objToDelete.user === currentUser.uid) {
            if (confirm(`"${objToDelete.name || "Obyekt"}" ni o'chirmoqchimisiz?`)) {
              await onDeleteMapObject(objToDelete.id)
            }
          } else {
            alert("Faqat o'z obyektlaringizni o'chira olasiz!")
          }
        }
        break
      case "marker":
        markerTool.createMarker(roundedLat, roundedLng)
        break
      case "text":
        markerTool.createTextMarker(roundedLat, roundedLng)
        break
      case "brush":
        markerTool.createBrushMarker(roundedLat, roundedLng)
        break
      case "highlighter":
        markerTool.createHighlighterMarker(roundedLat, roundedLng)
        break
      case "ruler":
        if (!currentDrawingObjectId.current) {
          // Start new measurement
          const objectId = await onAddMapObject({
            type: "line",
            name: "Masofa o'lchash",
            desc: "Masofa o'lchash uchun ikkinchi nuqtani tanlang",
            color: drawingColor,
            path: [[roundedLat, roundedLng]],
            distance: 0,
          })
          currentDrawingObjectId.current = objectId

          // Show hint marker
          if (drawingHintMarkerRef.current) {
            mapRef.current?.removeLayer(drawingHintMarkerRef.current)
          }
          drawingHintMarkerRef.current = L.marker([roundedLat, roundedLng], {
            icon: L.divIcon({
              className: "ruler-hint-marker",
              html: '<div style="background: red; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white;"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            }),
          }).addTo(mapRef.current!)
        } else {
          // Complete measurement
          const startObj = objects.find((o) => o.id === currentDrawingObjectId.current)
          if (startObj && startObj.path && startObj.path.length > 0) {
            const startPoint = startObj.path[0]
            const distance = mapRef.current?.distance([startPoint[0], startPoint[1]], [roundedLat, roundedLng]) / 1000 // km

            await onUpdateMapObject(currentDrawingObjectId.current, {
              path: [startPoint, [roundedLat, roundedLng]],
              distance: distance,
              desc: `Masofa: ${distance.toFixed(2)} km`,
            })
          }

          currentDrawingObjectId.current = null
          if (drawingHintMarkerRef.current) {
            mapRef.current?.removeLayer(drawingHintMarkerRef.current)
            drawingHintMarkerRef.current = null
          }
          handleToolComplete()
        }
        break
      case "compass":
        markerTool.createCompassMarker(roundedLat, roundedLng)
        break
      case "crosshair":
        markerTool.createCrosshairMarker(roundedLat, roundedLng)
        break
      case "arrow":
        markerTool.createArrowMarker(roundedLat, roundedLng)
        break
      case "fill":
        markerTool.createFillMarker(roundedLat, roundedLng)
        break
      case "circle":
        shapeTools.createCircle(roundedLat, roundedLng)
        break
      case "triangle":
        shapeTools.createTriangle(roundedLat, roundedLng)
        break
      case "polygon":
        shapeTools.createPolygon(roundedLat, roundedLng)
        break
      case "star":
        shapeTools.createStar(roundedLat, roundedLng)
        break
      case "heart":
        shapeTools.createHeart(roundedLat, roundedLng)
        break
      case "area":
        if (geomanLoaded && (mapRef.current as any).pm) {
          ;(mapRef.current as any).pm.enableDraw("Rectangle", {
            templineStyle: { color: drawingColor },
            hintlineStyle: { color: drawingColor, dashArray: [5, 5] },
            pathOptions: { color: drawingColor, fillColor: drawingColor, fillOpacity: 0.3 },
          })
        }
        break
      case "path":
        if (geomanLoaded && (mapRef.current as any).pm) {
          ;(mapRef.current as any).pm.enableDraw("Line", {
            templineStyle: { color: drawingColor },
            hintlineStyle: { color: drawingColor, dashArray: [5, 5] },
            pathOptions: { color: drawingColor },
          })
        }
        break
      default:
        // Do nothing for cursor tool
        break
    }
  }

  const handleObjectClick = (objectId: string, e: L.LeafletEvent) => {
    e.originalEvent?.stopPropagation()

    if (selectedObjectId === objectId) {
      // Toggle edit mode if same object clicked
      setEditMode(!editMode)
    } else {
      // Select new object
      setSelectedObjectId(objectId)
      setEditMode(true)
    }
  }

  const handleObjectResize = async (objectId: string, newSize: number) => {
    const obj = objects.find((o) => o.id === objectId)
    if (obj && obj.user === currentUser?.uid) {
      try {
        const clampedSize = Math.max(10, Math.min(200, newSize)) // Increased max size for shapes
        await onUpdateMapObject(objectId, {
          size: clampedSize,
        })
      } catch (error) {
        console.error("Error resizing object:", error)
      }
    }
  }

  const handleObjectDrag = async (objectId: string, newLat: number, newLng: number) => {
    const obj = objects.find((o) => o.id === objectId)
    if (obj && obj.user === currentUser?.uid) {
      try {
        await onUpdateMapObject(objectId, {
          lat: newLat,
          lng: newLng,
        })
      } catch (error) {
        console.error("Error moving object:", error)
      }
    }
  }

  const handleEditObject = async (objectId: string) => {
    const obj = objects.find((o) => o.id === objectId)
    if (obj && obj.user === currentUser?.uid) {
      const newName = prompt("Yangi nom kiriting:", obj.name || "")
      if (newName !== null) {
        const newDescription = prompt("Yangi tavsif kiriting:", obj.description || "")
        if (newDescription !== null) {
          // Ask for coordinate change
          const changeLocation = confirm("Joylashuvni o'zgartirishni xohlaysizmi?")
          let newLat = obj.lat
          let newLng = obj.lng

          if (changeLocation) {
            const latInput = prompt("Yangi latitude kiriting:", obj.lat.toString())
            const lngInput = prompt("Yangi longitude kiriting:", obj.lng.toString())

            if (latInput && lngInput) {
              const parsedLat = Number.parseFloat(latInput)
              const parsedLng = Number.parseFloat(lngInput)

              if (
                !isNaN(parsedLat) &&
                !isNaN(parsedLng) &&
                parsedLat >= -90 &&
                parsedLat <= 90 &&
                parsedLng >= -180 &&
                parsedLng <= 180
              ) {
                newLat = parsedLat
                newLng = parsedLng
              } else {
                alert("Noto'g'ri koordinatalar kiritildi!")
                return
              }
            }
          }

          try {
            await onUpdateMapObject(objectId, {
              name: newName.trim() || obj.name,
              description: newDescription.trim() || obj.description,
              lat: newLat,
              lng: newLng,
            })
            setSelectedObjectId(null)
            setEditMode(false)
            mapRef.current?.closePopup()
          } catch (error) {
            console.error("Error updating object:", error)
            alert("Obyektni yangilashda xatolik yuz berdi!")
          }
        }
      }
    }
  }

  const handleDeleteObject = async (objectId: string) => {
    const obj = objects.find((o) => o.id === objectId)
    if (obj && obj.user === currentUser?.uid) {
      if (confirm(`"${obj.name || "Obyekt"}" ni haqiqatan ham o'chirmoqchimisiz?`)) {
        try {
          await onDeleteMapObject(objectId)
          setSelectedObjectId(null)
          setEditMode(false)
          mapRef.current?.closePopup()
          alert("Obyekt muvaffaqiyatli o'chirildi!")
        } catch (error) {
          console.error("Error deleting object:", error)
          alert("Obyektni o'chirishda xatolik yuz berdi!")
        }
      }
    } else {
      alert("Faqat o'z obyektlaringizni o'chirish mumkin!")
    }
  }

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, zoom?: number) => {
      if (mapRef.current) {
        try {
          const targetZoom = zoom || Math.max(mapRef.current.getZoom(), 10)
          mapRef.current.flyTo([lat, lng], targetZoom, {
            animate: true,
            duration: 1.5,
          })
        } catch (error) {
          console.error("Error in panTo:", error)
        }
      }
    },
    focusLayer: (objectId: string) => {
      const map = mapRef.current
      if (!map) return

      const targetObject = mapObjectsRef.current.find((obj) => obj.id === objectId)
      if (targetObject?.leafletLayer) {
        if (targetObject.leafletLayer instanceof L.Marker) {
          map.flyTo(targetObject.leafletLayer.getLatLng(), 17)
        } else if (targetObject.leafletLayer instanceof L.Polyline || targetObject.leafletLayer instanceof L.Polygon) {
          map.fitBounds(targetObject.leafletLayer.getBounds(), { padding: [50, 50] })
        }
      }
    },
    takeScreenshot: () => {
      if (!mapRef.current) return

      import("html2canvas")
        .then((html2canvasModule) => {
          const html2canvas = html2canvasModule.default
          const mapContainer = mapContainerRef.current
          if (mapContainer) {
            setTimeout(() => {
              html2canvas(mapContainer, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#ffffff",
                scale: 1,
                logging: false,
              })
                .then((canvas) => {
                  const link = document.createElement("a")
                  link.download = `map-screenshot-${new Date().toISOString().slice(0, 10)}.png`
                  link.href = canvas.toDataURL("image/png", 1.0)
                  link.click()
                })
                .catch((error) => {
                  console.error("Screenshot failed:", error)
                })
            }, 500)
          }
        })
        .catch((error) => {
          console.error("Failed to load html2canvas:", error)
        })
    },
    exportMapData: () => {
      const exportData = {
        objects: objects,
        timestamp: new Date().toISOString(),
        bounds: mapRef.current?.getBounds(),
        zoom: mapRef.current?.getZoom(),
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `map-data-${new Date().toISOString().slice(0, 10)}.json`
      link.click()

      URL.revokeObjectURL(url)
    },
    importMapData: () => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const data = JSON.parse(e.target?.result as string)
              console.log("Imported data:", data)
            } catch (error) {
              console.error("Error importing data:", error)
            }
          }
          reader.readAsText(file)
        }
      }
      input.click()
    },
    zoomIn: () => {
      if (mapRef.current) {
        mapRef.current.zoomIn()
      }
    },
    zoomOut: () => {
      if (mapRef.current) {
        mapRef.current.zoomOut()
      }
    },
    fitToScreen: () => {
      if (mapRef.current && objects.length > 0) {
        const group = new L.FeatureGroup()
        objects.forEach((obj) => {
          if (obj.coordinates && obj.coordinates.length > 0) {
            const coords = obj.coordinates.map((coord) => [coord.lat, coord.lng] as [number, number])
            if (obj.type === "marker") {
              group.addLayer(L.marker(coords[0]))
            } else {
              group.addLayer(L.polyline(coords))
            }
          }
        })
        if (group.getLayers().length > 0) {
          mapRef.current.fitBounds(group.getBounds(), { padding: [20, 20] })
        }
      }
    },
    toggleGrid: () => {
      console.log("Toggle grid")
    },
    locateUser: () => {
      if (navigator.geolocation && mapRef.current) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords
          mapRef.current?.setView([latitude, longitude], 15)
        })
      }
    },
  }))

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      renderer: L.canvas({ tolerance: 10 }),
      zoomControl: false,
    }).setView([initialLat, initialLon], initialZoom)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      minZoom: 3,
      noWrap: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    map.setMaxBounds([
      [84.67351256610522, -174.0234375],
      [-58.995311187950925, 223.2421875],
    ])

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || geomanLoaded) return

    const initializeGeoman = () => {
      try {
        if (map && (map as any).pm && typeof (map as any).pm.setOptIn === "function") {
          ;(map as any).pm.setOptIn(true)
          ;(map as any).pm.setGlobalOptions({
            pinning: true,
            snappable: true,
            allowSelfIntersection: false,
          })
          setGeomanLoaded(true)
        } else {
          setTimeout(initializeGeoman, 100)
        }
      } catch (error) {
        console.error("Error initializing Leaflet-Geoman:", error)
        setTimeout(initializeGeoman, 200)
      }
    }

    const timeoutId = setTimeout(initializeGeoman, 100)
    return () => clearTimeout(timeoutId)
  }, [mapRef.current, geomanLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !geomanLoaded || !(map as any).pm) return

    const handleGeomanCreate = (e: any) => {
      const layer = e.layer
      const shape = e.shape

      if (shape === "Rectangle" || shape === "Polygon") {
        const bounds = layer.getBounds()
        const path = [
          [bounds.getNorth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()],
          [bounds.getSouth(), bounds.getEast()],
          [bounds.getSouth(), bounds.getWest()],
        ]

        onAddMapObject({
          type: "area",
          name: "Hudud",
          desc: "",
          color: drawingColor,
          path: path,
          area: (layer as any).getArea ? (layer as any).getArea() / 1000000 : 0, // Convert to km²
        }).then(() => {
          handleToolComplete()
        })
      } else if (shape === "Line") {
        const latlngs = layer.getLatLngs()

        onAddMapObject({
          type: "line",
          name: "Chiziq",
          desc: "",
          color: drawingColor,
          path: latlngs,
          distance: layer.getDistance ? layer.getDistance() / 1000 : 0, // Convert to km
        }).then(() => {
          handleToolComplete()
        })
      }

      // Remove the temporary layer
      map.removeLayer(layer)
    }

    map.on("pm:create", handleGeomanCreate)

    return () => {
      map.off("pm:create", handleGeomanCreate)
    }
  }, [geomanLoaded, drawingColor, onAddMapObject])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasAccess) return

    // Clear existing cursor markers
    Object.values(userCursorsRef.current).forEach((marker) => {
      map.removeLayer(marker)
    })
    userCursorsRef.current = {}

    // Render cursor markers for all active users (except current user)
    users.forEach((user) => {
      if (user.id === currentUser?.uid || !user.active || !user.isBroadcastingCursor) return

      const cursorIcon = L.divIcon({
        className: "user-cursor-marker",
        html: `
          <div class="user-cursor-container" style="position: relative;">
            <div class="user-cursor-icon" style="color: ${user.color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              ${defaultCursorSvg}
            </div>
            <div class="user-cursor-name-hover" style="
              position: absolute;
              top: 26px;
              left: 50%;
              transform: translateX(-50%);
              background: ${user.color};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              opacity: 0;
              visibility: hidden;
              transition: opacity 0.2s ease, visibility 0.2s ease;
              pointer-events: none;
              z-index: 1000;
            ">
              ${user.email || user.name || "Anonim"}
            </div>
          </div>
        `,
        iconSize: [24, 40],
        iconAnchor: [12, 12],
      })

      const cursorMarker = L.marker([user.lat, user.lng], {
        icon: cursorIcon,
        interactive: true,
        zIndexOffset: 1000,
        pane: "overlayPane",
      }).addTo(map)

      // Add click handler for cursor marker to start following user
      cursorMarker.on("click", () => {
        if (onObserveUser) {
          onObserveUser(user.id)
        }
      })

      userCursorsRef.current[user.id] = cursorMarker
    })

    if (observingUser && userCursorsRef.current[observingUser.id]) {
      const observedUser = users.find((u) => u.id === observingUser.id)
      if (observedUser && observedUser.active) {
        map.flyTo([observedUser.lat, observedUser.lng], Math.max(map.getZoom(), 15), {
          duration: 1.5,
          easeLinearity: 0.25,
        })
      }
    }
  }, [users, currentUser, hasAccess, observingUser, onObserveUser])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !observingUser || !hasAccess) return

    const observedUser = users.find((u) => u.id === observingUser.id)
    if (!observedUser || !observedUser.active) return

    let lastUserState = {
      lat: observedUser.lat,
      lng: observedUser.lng,
      zoom: observedUser.zoom || map.getZoom(),
    }

    const followInterval = setInterval(() => {
      const currentObservedUser = users.find((u) => u.id === observingUser.id)
      if (currentObservedUser && currentObservedUser.active) {
        const currentUserState = {
          lat: currentObservedUser.lat,
          lng: currentObservedUser.lng,
          zoom: currentObservedUser.zoom || map.getZoom(),
        }

        const hasMoved =
          Math.abs(currentUserState.lat - lastUserState.lat) > 0.00001 ||
          Math.abs(currentUserState.lng - lastUserState.lng) > 0.00001
        const hasZoomed = Math.abs(currentUserState.zoom - lastUserState.zoom) > 0.1

        if (hasMoved || hasZoomed) {
          const targetZoom = currentUserState.zoom

          map.setView([currentUserState.lat, currentUserState.lng], targetZoom, {
            animate: true,
            duration: 0.3,
          })

          lastUserState = currentUserState
        }
      }
    }, 100)

    return () => clearInterval(followInterval)
  }, [users, observingUser, hasAccess])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasAccess) return

    const handleMapMove = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      const bounds = map.getBounds()
      const view: [number, number] = [
        bounds.getNorthEast().lat - bounds.getSouthWest().lat,
        bounds.getNorthEast().lng - bounds.getSouthWest().lng,
      ]

      onUpdateCurrentUserLocation(center.lat, center.lng, view, zoom)
    }

    map.on("moveend", handleMapMove)

    return () => {
      map.off("moveend", handleMapMove)
    }
  }, [hasAccess, onUpdateCurrentUserLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !objects.length) return

    // Clear existing objects
    mapObjectsRef.current.forEach((leafletObj) => {
      if (leafletObj.leafletLayer) {
        mapRef.current?.removeLayer(leafletObj.leafletLayer)
      }
    })
    mapObjectsRef.current = []

    objects.forEach((obj) => {
      const userDisplayName = users.find((u) => u.uid === obj.user)?.email || obj.user

      const leafletObj: LeafletMapObject = {
        id: obj.id,
        leafletLayer: null,
      }
      mapObjectsRef.current.push(leafletObj)

      if (obj.type === "marker") {
        const isSelected = selectedObjectId === obj.id
        const size = obj.size || 30

        const markerIcon = L.divIcon({
          html: `
            <div style="
              background: ${obj.color}; 
              width: ${size}px; 
              height: ${size}px; 
              border-radius: 50%; 
              border: ${isSelected ? "3px solid #3b82f6" : "2px solid white"};
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${size * 0.6}px;
              color: white;
              cursor: pointer;
              position: relative;
            ">
              📍
              ${
                isSelected && editMode
                  ? `
                <div style="
                  position: absolute;
                  top: -5px;
                  right: -5px;
                  width: 10px;
                  height: 10px;
                  background: #3b82f6;
                  border: 1px solid white;
                  border-radius: 2px;
                  cursor: nw-resize;
                " class="resize-handle"></div>
              `
                  : ""
              }
            </div>
          `,
          iconSize: [size + 6, size + 6],
          iconAnchor: [(size + 6) / 2, (size + 6) / 2],
        })

        const marker = L.marker([obj.lat, obj.lng], {
          icon: markerIcon,
          draggable: isSelected && editMode && obj.user === currentUser?.uid,
        }).addTo(map)

        marker.on("click", (e) => handleObjectClick(obj.id, e))

        if (isSelected && editMode && obj.user === currentUser?.uid) {
          marker.on("dragend", (e) => {
            const newLatLng = e.target.getLatLng()
            handleObjectDrag(obj.id, newLatLng.lat, newLatLng.lng)
          })
        }

        marker.bindPopup(createPopupContent(leafletObj))

        leafletObj.leafletLayer = marker
      } else if (obj.type === "draw" && obj.coords) {
        // Render drawing paths
        const coordinates: [number, number][] = []
        Object.values(obj.coords).forEach((coord) => {
          if (coord.set && coord.set.length === 2) {
            coordinates.push([coord.set[0], coord.set[1]])
          }
        })

        if (coordinates.length > 1) {
          const polyline = L.polyline(coordinates, {
            color: obj.color,
            weight: 3,
            opacity: 0.8,
          }).addTo(map)

          polyline.bindPopup(createPopupContent(leafletObj))

          leafletObj.leafletLayer = polyline
        }
      } else if (obj.type === "line" && obj.path) {
        // Render line objects
        const polyline = L.polyline(obj.path, {
          color: obj.color,
          weight: 3,
          opacity: 0.8,
        }).addTo(map)

        polyline.bindPopup(createPopupContent(leafletObj))

        leafletObj.leafletLayer = polyline
      } else if (obj.type === "area" && obj.coordinates) {
        // Render area objects
        const polygon = L.polygon(obj.coordinates, {
          color: obj.color,
          fillColor: obj.color,
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(map)

        polygon.bindPopup(createPopupContent(leafletObj))

        leafletObj.leafletLayer = polygon
      } else if (obj.type === "circle") {
        const radius = (obj.size || 50) / 2
        const circle = L.circle([obj.lat, obj.lng], {
          radius: radius,
          color: obj.color || "#3b82f6",
          fillColor: obj.color || "#3b82f6",
          fillOpacity: 0.3,
          weight: 3,
        }).addTo(map)

        // Add resize handles for circle
        if (selectedObjectId === obj.id && editMode && obj.user === currentUser?.uid) {
          const resizeIcon = L.divIcon({
            html: `
              <div style="
                position: relative;
                width: 10px;
                height: 10px;
                background: #3b82f6;
                border: 2px solid white;
                border-radius: 50%;
                cursor: nw-resize;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              " class="resize-handle" data-object-id="${obj.id}"></div>
            `,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })

          const resizeMarker = L.marker([obj.lat + radius / 111320, obj.lng], {
            icon: resizeIcon,
            draggable: false,
          }).addTo(map)

          mapObjectsRef.current.push(resizeMarker)
        }

        mapObjectsRef.current.push(circle)
      } else if (obj.type === "triangle" || obj.type === "polygon" || obj.type === "star" || obj.type === "heart") {
        const size = obj.size || 50
        const points = getShapePoints(obj.type, obj.lat, obj.lng, size)

        const polygon = L.polygon(points, {
          color: obj.color || "#3b82f6",
          fillColor: obj.color || "#3b82f6",
          fillOpacity: 0.3,
          weight: 3,
        }).addTo(map)

        // Add resize handles for polygons
        if (selectedObjectId === obj.id && editMode && obj.user === currentUser?.uid) {
          const resizeIcon = L.divIcon({
            html: `
              <div style="
                position: relative;
                width: 10px;
                height: 10px;
                background: #3b82f6;
                border: 2px solid white;
                border-radius: 2px;
                cursor: nw-resize;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              " class="resize-handle" data-object-id="${obj.id}"></div>
            `,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })

          const resizeMarker = L.marker([obj.lat + size / 222640, obj.lng + size / 222640], {
            icon: resizeIcon,
            draggable: false,
          }).addTo(map)

          mapObjectsRef.current.push(resizeMarker)
        }

        mapObjectsRef.current.push(polygon)
      } else if (obj.type === "path" && obj.coordinates) {
        const polyline = L.polyline(obj.coordinates, {
          color: obj.color || "#3b82f6",
          weight: obj.size || 3,
        }).addTo(map)

        mapObjectsRef.current.push(polyline)
      }
    })

    const resizeHandles = document.querySelectorAll(".resize-handle")
    resizeHandles.forEach((handle) => {
      if (!handle) return

      handle.addEventListener("mousedown", (e) => {
        e.stopPropagation()
        const objectId = (handle as HTMLElement).dataset.objectId || selectedObjectId
        if (!objectId) return

        const mouseEvent = e as MouseEvent
        if (!mouseEvent.clientY) return

        const startY = mouseEvent.clientY
        const startX = mouseEvent.clientX
        const obj = objects.find((o) => o.id === objectId)
        const startSize = obj?.size || 30

        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!moveEvent.clientY || !moveEvent.clientX) return

          // Calculate size change based on diagonal movement
          const deltaY = startY - moveEvent.clientY
          const deltaX = moveEvent.clientX - startX
          const delta = Math.sqrt(deltaY * deltaY + deltaX * deltaX)
          const direction = deltaY > 0 ? 1 : -1

          const newSize = Math.max(10, Math.min(200, startSize + delta * direction * 0.5))
          handleObjectResize(objectId, newSize)
        }

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove)
          document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
      })

      handle.addEventListener("dblclick", (e) => {
        e.stopPropagation()
        e.preventDefault()
      })
    })

    return () => {
      resizeHandles.forEach((handle) => {
        handle.removeEventListener("mousedown", () => {})
        handle.removeEventListener("dblclick", () => {})
      })
    }
  }, [objects, selectedObjectId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (activeTool === "pen") {
      // Disable map dragging when pen tool is selected
      map.dragging.disable()
      map.doubleClickZoom.disable()
      map.scrollWheelZoom.disable()
      map.boxZoom.disable()
      map.keyboard.disable()
    } else {
      // Enable all interactions for cursor and other tools
      map.dragging.enable()
      map.doubleClickZoom.enable()
      map.scrollWheelZoom.enable()
      map.boxZoom.enable()
      map.keyboard.enable()
    }
  }, [activeTool])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.on("click", handleMapClick)
    map.on("mousemove", handleMouseMove)
    map.on("mousedown", handleMouseDown)
    map.on("mouseup", handleMouseUp)

    return () => {
      map.off("click", handleMapClick)
      map.off("mousemove", handleMouseMove)
      map.off("mousedown", handleMouseDown)
      map.off("mouseup", handleMouseUp)
    }
  }, [activeTool, drawingColor, hasAccess, currentUser])

  const getUserDisplayName = (userId: string) => {
    const user = users.find((u) => u.id === userId || u.uid === userId)
    return user?.email || user?.name || "Anonim foydalanuvchi"
  }

  const createPopupContent = (obj: LeafletMapObject) => {
    const isOwner = obj.user === currentUser?.uid
    const userName = getUserDisplayName(obj.user)

    const description = obj.desc || obj.description || ""
    const displayName = obj.name || ""

    return `
      <div class="p-2">
        <h3 class="font-bold text-lg mb-2">${displayName || "Belgi"}</h3>
        <p class="text-sm text-gray-600 mb-2">${description || "Tavsif kiritilmagan"}</p>
        <p class="text-xs text-gray-500 mb-3">Yaratuvchi: ${userName}</p>
        ${
          isOwner
            ? `
          <div class="flex gap-2">
            <button 
              onclick="handleEditObject('${obj.id}')" 
              class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Tahrirlash
            </button>
            <button 
              onclick="handleDeleteObject('${obj.id}')" 
              class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              O'chirish
            </button>
          </div>
        `
            : ""
        }
      </div>
    `
  }

  useEffect(() => {
    ;(window as any).handleEditObject = handleEditObject
    ;(window as any).handleDeleteObject = handleDeleteObject

    return () => {
      delete (window as any).handleEditObject
      delete (window as any).handleDeleteObject
    }
  }, [objects, currentUser])

  const getShapePoints = (type: string, lat: number, lng: number, size: number): [number, number][] => {
    const offset = size / 222640 // Convert pixels to lat/lng offset

    switch (type) {
      case "triangle":
        return [
          [lat + offset, lng],
          [lat - offset, lng - offset],
          [lat - offset, lng + offset],
        ]
      case "star":
        const points: [number, number][] = []
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5
          const radius = i % 2 === 0 ? offset : offset / 2
          points.push([lat + radius * Math.cos(angle), lng + radius * Math.sin(angle)])
        }
        return points
      case "heart":
        const heartPoints: [number, number][] = []
        for (let i = 0; i <= 100; i++) {
          const t = (i / 100) * 2 * Math.PI
          const x = 16 * Math.pow(Math.sin(t), 3)
          const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
          heartPoints.push([lat + (y * offset) / 16, lng + (x * offset) / 16])
        }
        return heartPoints
      case "polygon":
      default:
        return [
          [lat + offset, lng + offset],
          [lat + offset, lng - offset],
          [lat - offset, lng - offset],
          [lat - offset, lng + offset],
        ]
    }
  }

  return <div id="mapDiv" ref={mapContainerRef} className="relative z-0" />
})
