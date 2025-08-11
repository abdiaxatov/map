"use client"

import type React from "react"

import type { User, Session } from "firebase/auth"
import type { UserCursor, MapObject, RoomDetails } from "@/hooks/use-map-data" // RoomDetails import qilindi
import { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from "react"
import L from "leaflet"
import "@geoman-io/leaflet-geoman-free" // This imports the plugin and extends L

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
  mapDetails: RoomDetails | null // Yangi prop
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

// 10 ta turli xil sichqoncha SVG yo'llari
const cursorSvgPaths = [
  // 1. Default Arrow
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M5.51169 15.8783L1.08855 3.64956C0.511984 2.05552 2.05554 0.511969 3.64957 1.08853L15.8783 5.51168C17.5843 6.12877 17.6534 8.51606 15.9858 9.23072L11.2573 11.2573L9.23074 15.9858C8.51607 17.6534 6.12878 17.5843 5.51169 15.8783Z" fill="currentColor"/></svg>`,
  // 2. Filled Triangle
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L16 22H8L2 16V8L8 2Z" fill="currentColor"/></svg>`,
  // 3. Filled Circle
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>`,
  // 4. Filled Square
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" fill="currentColor"/></svg>`,
  // 5. Filled Diamond
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L16 22H8L2 16V8L8 2Z" fill="currentColor"/></svg>`,
  // 6. Filled Star
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>`,
  // 7. Filled Plus
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 2H13V11H22V13H13V22H11V13H2V11H11V2Z" fill="currentColor"/></svg>`,
  // 8. Filled Hexagon
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L16 22H8L2 16V8L8 2Z" fill="currentColor"/></svg>`,
  // 9. Filled Pentagon
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 9H22L17 20H7L12 2Z" fill="currentColor"/></svg>`,
  // 10. Filled Octagon
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2H16L22 8V16L16 22H8L2 16V8L8 2Z" fill="currentColor"/></svg>`,
]

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
  const currentDrawingLineDistance = useRef(0)
  const currentDrawingLastCoord = useRef<L.LatLng | null>(null)
  const isMouseDown = useRef(false)
  const userCursorsRef = useRef<{ [key: string]: L.Marker }>({})
  const userLocationMarkerRef = useRef<L.Marker | null>(null)
  const mapObjectsRef = useRef<LeafletMapObject[]>([])
  const drawingHintMarkerRef = useRef<L.Marker | null>(null)
  const placeIdsRef = useRef<Set<string>>(new Set())
  const [geomanLoaded, setGeomanLoaded] = useState(false)

  const handleMouseMove = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    const roundedLat = Number.parseFloat(lat.toFixed(5))
    const roundedLng = Number.parseFloat(lng.toFixed(5))

    // Update drawing hint marker position
    if (drawingHintMarkerRef.current && (activeTool === "pen" || activeTool === "area" || activeTool === "path")) {
      drawingHintMarkerRef.current.setLatLng([lat, lng])
    }

    // Continue drawing for pen tool
    if (activeTool === "pen" && isMouseDown.current && currentDrawingObjectId.current) {
      onAddDrawingCoordinate(currentDrawingObjectId.current, roundedLat, roundedLng)
    }

    // Update current user location
    if (currentUser && currentSession) {
      onUpdateCurrentUserLocation(roundedLat, roundedLng, [roundedLat, roundedLng], mapRef.current?.getZoom() || 0)
    }
  }

  const handleMouseDown = (e: L.LeafletMouseEvent) => {
    if (!currentUser) return
    isMouseDown.current = true
    if (activeTool === "pen") {
      const { lat, lng } = e.latlng
      const roundedLat = Number.parseFloat(lat.toFixed(5))
      const roundedLng = Number.parseFloat(lng.toFixed(5))
      // Start drawing logic
      const startDrawing = async (lat: number, lng: number) => {
        const newObjectId = await onAddMapObject({
          color: drawingColor,
          initlat: lat,
          initlng: lng,
          type: "draw",
          name: "Drawing",
          desc: "",
          distance: 0,
          area: 0,
        })
        if (newObjectId) {
          currentDrawingObjectId.current = newObjectId
          onAddDrawingCoordinate(newObjectId, lat, lng)
        }
      }
      startDrawing(roundedLat, roundedLng)
    }
  }

  const handleMouseUp = () => {
    isMouseDown.current = false
    if (activeTool === "pen" && currentDrawingObjectId.current) {
      onUpdateMapObject(currentDrawingObjectId.current, { completed: true })
      currentDrawingObjectId.current = null
    }
  }

  const handleClick = (e: L.LeafletMouseEvent) => {
    if (!currentUser) return
    if (activeTool === "marker") {
      const { lat, lng } = e.latlng
      const roundedLat = Number.parseFloat(lat.toFixed(5))
      const roundedLng = Number.parseFloat(lng.toFixed(5))
      // Create marker logic
      const createMarker = async (lat: number, lng: number) => {
        const newObjectId = await onAddMapObject({
          color: drawingColor,
          lat: lat,
          lng: lng,
          type: "marker",
          name: "Marker",
          desc: "",
        })
        if (newObjectId) {
          const tempMarker = L.marker([lat, lng], {
            zIndexOffset: 9999,
            interactive: false,
            pane: "overlayPane",
          }).addTo(mapRef.current || L.map("mapDiv"))

          tempMarker.setOpacity(0)

          tempMarker.bindTooltip(
            `
            <label for="shape-name">Name</label>
            <input value="Marker" id="shape-name" name="shape-name" />
            <label for="shape-desc">Description</label>
            <textarea id="shape-desc" name="description"></textarea>
            <br>
            <div id="buttons">
              <button class="cancel-button">Cancel</button>
              <button class="save-button">Save</button>
            </div>
            <div class="arrow-down"></div>
            `,
            {
              permanent: true,
              direction: "top",
              interactive: true,
              bubblingMouseEvents: false,
              className: "create-shape-flow create-form",
              offset: L.point({ x: 0, y: -35 }),
            },
          )
          tempMarker.openTooltip()

          setTimeout(() => {
            const nameInput = document.getElementById("shape-name") as HTMLInputElement
            if (nameInput) {
              nameInput.focus()
              nameInput.select()
            }
          }, 0)

          const tooltipContainer = tempMarker.getTooltip()?.getElement()
          if (tooltipContainer) {
            const saveButton = tooltipContainer.querySelector(".save-button")
            const cancelButton = tooltipContainer.querySelector(".cancel-button")

            const handleSave = async () => {
              const name = (tooltipContainer.querySelector("#shape-name") as HTMLInputElement)?.value
              const desc = (tooltipContainer.querySelector("#shape-desc") as HTMLTextAreaElement)?.value
              await onUpdateMapObject(newObjectId, {
                name: sanitize(name || "Marker"),
                desc: sanitize(desc || ""),
                completed: true,
              })
              tempMarker.closeTooltip()
              tempMarker.remove()
            }

            const handleCancel = async () => {
              await onDeleteMapObject(newObjectId)
              tempMarker.closeTooltip()
              tempMarker.remove()
            }

            saveButton?.addEventListener("click", handleSave)
            cancelButton?.addEventListener("click", handleCancel)

            tempMarker.on("tooltipclose", () => {
              saveButton?.removeEventListener("click", handleSave)
              cancelButton?.removeEventListener("click", handleCancel)
              tempMarker.remove()
            })
          }
        }
      }
      createMarker(roundedLat, roundedLng)
      return
    }

    if (activeTool === "text") {
      const { lat, lng } = e.latlng
      const roundedLat = Number.parseFloat(lat.toFixed(5))
      const roundedLng = Number.parseFloat(lng.toFixed(5))

      // Create text marker
      const createTextMarker = async (lat: number, lng: number) => {
        const newObjectId = await onAddMapObject({
          color: drawingColor,
          lat: lat,
          lng: lng,
          type: "text",
          name: "Text",
          desc: "",
        })

        if (newObjectId) {
          const textMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: "text-marker",
              html: `<div style="background: white; padding: 4px 8px; border: 2px solid ${drawingColor}; border-radius: 4px; color: ${drawingColor}; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">Text</div>`,
              iconSize: [60, 30],
              iconAnchor: [30, 15],
            }),
            zIndexOffset: 9999,
            interactive: false,
          }).addTo(mapRef.current || L.map("mapDiv"))

          textMarker.bindTooltip(
            `
            <label for="text-content">Text Content</label>
            <input value="Text" id="text-content" name="text-content" />
            <label for="text-desc">Description</label>
            <textarea id="text-desc" name="description"></textarea>
            <br>
            <div id="buttons">
              <button class="cancel-button">Cancel</button>
              <button class="save-button">Save</button>
            </div>
            <div class="arrow-down"></div>
            `,
            {
              permanent: true,
              direction: "top",
              interactive: true,
              bubblingMouseEvents: false,
              className: "create-shape-flow create-form",
              offset: L.point({ x: 0, y: -35 }),
            },
          )
          textMarker.openTooltip()

          setTimeout(() => {
            const textInput = document.getElementById("text-content") as HTMLInputElement
            if (textInput) {
              textInput.focus()
              textInput.select()
            }
          }, 0)

          const tooltipContainer = textMarker.getTooltip()?.getElement()
          if (tooltipContainer) {
            const saveButton = tooltipContainer.querySelector(".save-button")
            const cancelButton = tooltipContainer.querySelector(".cancel-button")

            const handleSave = async () => {
              const textContent = (tooltipContainer.querySelector("#text-content") as HTMLInputElement)?.value
              const desc = (tooltipContainer.querySelector("#text-desc") as HTMLTextAreaElement)?.value

              // Update marker icon with new text
              textMarker.setIcon(
                L.divIcon({
                  className: "text-marker",
                  html: `<div style="background: white; padding: 4px 8px; border: 2px solid ${drawingColor}; border-radius: 4px; color: ${drawingColor}; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${textContent || "Text"}</div>`,
                  iconSize: [Math.max(60, (textContent || "Text").length * 8 + 16), 30],
                  iconAnchor: [Math.max(30, (textContent || "Text").length * 4 + 8), 15],
                }),
              )

              await onUpdateMapObject(newObjectId, {
                name: sanitize(textContent || "Text"),
                desc: sanitize(desc || ""),
                completed: true,
              })
              textMarker.closeTooltip()
            }

            const handleCancel = () => {
              textMarker.closeTooltip()
              textMarker.remove()
              onDeleteMapObject(newObjectId)
            }

            saveButton?.addEventListener("click", handleSave)
            cancelButton?.addEventListener("click", handleCancel)
          }
        }
      }

      createTextMarker(roundedLat, roundedLng)
      return
    }
  }

  const handleZoom = () => {
    // Handle zoom logic here
  }

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, zoom?: number) => {
      console.log("panTo called with:", { lat, lng, zoom })
      if (mapRef.current) {
        try {
          const targetZoom = zoom || Math.max(mapRef.current.getZoom(), 10)
          console.log("Flying to:", { lat, lng, zoom: targetZoom })
          mapRef.current.flyTo([lat, lng], targetZoom, {
            animate: true,
            duration: 1.5,
          })
        } catch (error) {
          console.error("Error in panTo:", error)
        }
      } else {
        console.warn("Map reference is not available")
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
            // Wait for map tiles to load completely
            setTimeout(() => {
              html2canvas(mapContainer, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#ffffff",
                scale: 1,
                logging: false,
                onclone: (clonedDoc) => {
                  // Ensure all map tiles are visible in the clone
                  const clonedMapContainer = clonedDoc.querySelector(".leaflet-container")
                  if (clonedMapContainer) {
                    clonedMapContainer.style.background = "#ffffff"
                  }
                },
              })
                .then((canvas) => {
                  const link = document.createElement("a")
                  link.download = `map-screenshot-${new Date().toISOString().slice(0, 10)}.png`
                  link.href = canvas.toDataURL("image/png", 1.0)
                  link.click()
                })
                .catch((error) => {
                  console.error("Screenshot failed:", error)
                  // Fallback: try to capture just the visible area
                  const canvas = document.createElement("canvas")
                  const ctx = canvas.getContext("2d")
                  if (ctx && mapContainer) {
                    canvas.width = mapContainer.offsetWidth
                    canvas.height = mapContainer.offsetHeight
                    ctx.fillStyle = "#ffffff"
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    ctx.font = "16px Arial"
                    ctx.fillStyle = "#333333"
                    ctx.textAlign = "center"
                    ctx.fillText("Map Screenshot", canvas.width / 2, canvas.height / 2)

                    const link = document.createElement("a")
                    link.download = `map-screenshot-${new Date().toISOString().slice(0, 10)}.png`
                    link.href = canvas.toDataURL()
                    link.click()
                  }
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
              // Here you would process the imported data
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
      // Grid functionality would be implemented here
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

  const sanitize = (string: string) => {
    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;",
    }
    const reg = /[&<>"'/]/gi
    return string.replace(reg, (match) => map[match])
  }

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

    drawingHintMarkerRef.current = L.marker([0, 0], {
      pane: "overlayPane",
      interactive: false,
    }).addTo(map)
    drawingHintMarkerRef.current.setOpacity(0)
    drawingHintMarkerRef.current
      .bindTooltip("", {
        permanent: true,
        offset: [5, 25],
        sticky: true,
        className: "hints",
        direction: "right",
      })
      .addTo(map)
    drawingHintMarkerRef.current.closeTooltip()

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
          console.log("Initializing Leaflet-Geoman plugin...")
          ;(map as any).pm.setOptIn(true)
          ;(map as any).pm.setGlobalOptions({
            pinning: true,
            snappable: true,
            allowSelfIntersection: false,
          })
          setGeomanLoaded(true)
          console.log("Leaflet-Geoman plugin initialized successfully")
        } else {
          console.warn("Leaflet-Geoman plugin not ready, retrying...")
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
    if (!map || !hasAccess) return

    map.on("mousemove", handleMouseMove)
    map.on("mousedown", handleMouseDown)
    map.on("mouseup", handleMouseUp)
    map.on("click", handleClick)
    map.on("zoom", handleZoom)
    map.on("moveend", handleZoom)

    return () => {
      map.off("mousemove", handleMouseMove)
      map.off("mousedown", handleMouseDown)
      map.off("mouseup", handleMouseUp)
      map.off("click", handleClick)
      map.off("zoom", handleZoom)
      map.off("moveend", handleZoom)
    }
  }, [
    currentUser,
    roomId,
    activeTool,
    onUpdateCurrentUserLocation,
    drawingColor,
    onAddMapObject,
    onAddDrawingCoordinate,
    onUpdateMapObject,
    onDeleteMapObject,
    hasAccess,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !geomanLoaded || !(map as any).pm || !hasAccess || !currentUser) return

    console.log(`Switching to tool: ${activeTool}`)

    // Clean up previous tool state
    ;(map as any).pm.disableDraw()
    ;(map as any).pm.disableGlobalRemovalMode()
    map.dragging.enable()

    // Remove existing hint marker
    if (drawingHintMarkerRef.current) {
      drawingHintMarkerRef.current.remove()
      drawingHintMarkerRef.current = null
    }

    switch (activeTool) {
      case "cursor":
        console.log("Cursor mode activated")
        map.dragging.enable()
        break

      case "pen":
        console.log("Pen drawing mode activated")
        map.dragging.disable()

        // Create enhanced hint marker for pen
        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 16px; height: 16px; background: ${drawingColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click and drag to draw", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break

      case "eraser":
        console.log("Eraser mode activated")
        ;(map as any).pm.enableGlobalRemovalMode()

        // Add eraser cursor hint
        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 20px; height: 20px; background: #ff4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(255,68,68,0.4);"></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click objects to delete them", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break

      case "marker":
        console.log("Marker mode activated")
        map.dragging.enable()

        // Add marker placement hint
        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 18px; height: 18px; background: ${drawingColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: bounce 1s infinite;"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click to place marker", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break

      case "area":
        console.log("Area drawing mode activated")
        map.dragging.disable()
        ;(map as any).pm.setPathOptions({
          color: drawingColor,
          fillColor: drawingColor,
          fillOpacity: 0.3,
          weight: 3,
        })
        ;(map as any).pm.enableDraw("Polygon", {
          tooltips: false,
          snappable: true,
          templineStyle: { color: drawingColor, weight: 3 },
          hintlineStyle: { color: drawingColor, dashArray: [8, 8], weight: 2 },
          pmIgnore: false,
          finishOn: "dblclick",
        })

        // Add area drawing hint marker
        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 16px; height: 16px; background: ${drawingColor}; border: 3px solid white; border-radius: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click to start area, double-click to finish", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break

      case "path":
        console.log("Line drawing mode activated")
        map.dragging.disable()
        ;(map as any).pm.setPathOptions({
          color: drawingColor,
          weight: 4,
        })
        ;(map as any).pm.enableDraw("Line", {
          tooltips: false,
          snappable: true,
          pmIgnore: false,
          finishOn: "dblclick",
        })

        // Add line drawing hint marker
        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 20px; height: 4px; background: ${drawingColor}; border-radius: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: -2px; left: 0; width: 2px; height: 8px; background: ${drawingColor};"></div><div style="position: absolute; top: -2px; right: 0; width: 2px; height: 8px; background: ${drawingColor};"></div></div>`,
            iconSize: [24, 8],
            iconAnchor: [12, 4],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click to start line, double-click to finish", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break

      case "circle":
        console.log("Circle mode activated")
        map.dragging.disable()
        if ((map as any).pm) {
          ;(map as any).pm.enableDraw("Circle", {
            snappable: true,
            snapDistance: 20,
            templineStyle: { color: drawingColor, weight: 3 },
            hintlineStyle: { color: drawingColor, dashArray: [5, 5] },
          })
        }

        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 20px; height: 20px; background: ${drawingColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click and drag to draw a circle", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break

      case "triangle":
        console.log("Triangle mode activated")
        map.dragging.disable()
        if ((map as any).pm) {
          ;(map as any).pm.enableDraw("Polygon", {
            snappable: true,
            snapDistance: 20,
            templineStyle: { color: drawingColor, weight: 3 },
            hintlineStyle: { color: drawingColor, dashArray: [5, 5] },
            pathOptions: { color: drawingColor, fillColor: drawingColor, fillOpacity: 0.3 },
          })
        }

        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 17px solid ${drawingColor}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></div>`,
            iconSize: [20, 17],
            iconAnchor: [10, 17],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click 3 points to draw a triangle", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break

      case "polygon":
      case "star":
      case "heart":
        console.log(`${activeTool} drawing mode activated`)
        map.dragging.disable()
        ;(map as any).pm.setPathOptions({
          color: drawingColor,
          fillColor: drawingColor,
          fillOpacity: 0.3,
          weight: 3,
        })
        ;(map as any).pm.enableDraw("Polygon", {
          tooltips: false,
          snappable: true,
          finishOn: "dblclick",
        })
        break

      case "text":
        console.log("Text mode activated")
        map.dragging.enable()

        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 24px; height: 24px; background: white; border: 2px solid ${drawingColor}; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${drawingColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">T</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click to add text", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break

      case "ruler":
        console.log("Ruler mode activated")
        map.dragging.disable()
        if ((map as any).pm) {
          ;(map as any).pm.enableDraw("Line", {
            snappable: true,
            snapDistance: 20,
            templineStyle: { color: drawingColor, weight: 3 },
            hintlineStyle: { color: drawingColor, dashArray: [5, 5] },
          })
        }

        drawingHintMarkerRef.current = L.marker([0, 0], {
          icon: L.divIcon({
            className: "drawing-hint-marker",
            html: `<div style="width: 20px; height: 4px; background: ${drawingColor}; border-radius: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: -2px; left: 0; width: 2px; height: 8px; background: ${drawingColor};"></div><div style="position: absolute; top: -2px; right: 0; width: 2px; height: 8px; background: ${drawingColor};"></div></div>`,
            iconSize: [20, 4],
            iconAnchor: [10, 2],
          }),
          interactive: false,
          zIndexOffset: 10000,
        }).addTo(map)

        drawingHintMarkerRef.current.bindTooltip("Click to start measuring distance", {
          permanent: false,
          direction: "top",
          offset: [0, -25],
          className: "drawing-tooltip",
        })
        break
    }
  }, [activeTool, drawingColor, geomanLoaded, hasAccess, currentUser])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const overlayPane = map.getPane("overlayPane")
    const tooltipPane = map.getPane("tooltipPane")

    if (overlayPane) {
      overlayPane.style.visibility = hideAnnotations ? "hidden" : "visible"
      overlayPane.style.pointerEvents = hideAnnotations ? "none" : "all"
    }
    if (tooltipPane) {
      tooltipPane.style.visibility = hideAnnotations ? "hidden" : "visible"
      tooltipPane.style.pointerEvents = hideAnnotations ? "none" : "all"
    }
  }, [hideAnnotations])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasAccess) return

    const locationControl = document.getElementById("location-control")

    const handleLocate = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latlng = L.latLng(position.coords.latitude, position.coords.longitude)
            map.flyTo(latlng, 18)
            if (!userLocationMarkerRef.current) {
              const icon = L.icon({
                iconUrl: "/placeholder.svg?height=24&width=24",
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })
              userLocationMarkerRef.current = L.marker(latlng, {
                icon: icon,
                pane: "overlayPane",
              }).addTo(map)
            } else {
              userLocationMarkerRef.current.setLatLng(latlng)
            }
          },
          (error) => {
            console.error("Geolocation error:", error)
          },
        )
      } else {
        console.log("Geolocation is not supported by this browser.")
      }
    }

    locationControl?.addEventListener("click", handleLocate)

    return () => {
      locationControl?.removeEventListener("click", handleLocate)
    }
  }, [hasAccess])

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
            <div class="user-cursor-name" style="
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
              opacity: 1;
              transition: none;
            ">
              ${user.name || "Anonim"}
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

      // Add tooltip with user info
      cursorMarker.bindTooltip(
        `
        <div style="text-align: center;">
          <strong>${user.name || "Anonim"}</strong><br>
          <small>Kuzatish uchun bosing</small>
        </div>
      `,
        {
          direction: "top",
          offset: [0, -35],
          className: "user-cursor-tooltip",
        },
      )

      userCursorsRef.current[user.id] = cursorMarker
    })

    if (observingUser && userCursorsRef.current[observingUser.id]) {
      const observedUser = users.find((u) => u.id === observingUser.id)
      if (observedUser && observedUser.active) {
        // Smoothly pan and zoom to observed user's location
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
      zoom: observedUser.zoom || map.getZoom(), // Use current map zoom as fallback
    }

    // Real-time follow with immediate response
    const followInterval = setInterval(() => {
      const currentObservedUser = users.find((u) => u.id === observingUser.id)
      if (currentObservedUser && currentObservedUser.active) {
        const currentUserState = {
          lat: currentObservedUser.lat,
          lng: currentObservedUser.lng,
          zoom: currentObservedUser.zoom || map.getZoom(), // Use current map zoom as fallback
        }

        // Check if user moved or zoomed
        const hasMoved =
          Math.abs(currentUserState.lat - lastUserState.lat) > 0.00001 ||
          Math.abs(currentUserState.lng - lastUserState.lng) > 0.00001
        const hasZoomed = Math.abs(currentUserState.zoom - lastUserState.zoom) > 0.1

        if (hasMoved || hasZoomed) {
          const targetZoom = currentUserState.zoom

          map.setView([currentUserState.lat, currentUserState.lng], targetZoom, {
            animate: true,
            duration: 0.3, // Faster animation for better sync
          })

          lastUserState = currentUserState
        }
      }
    }, 100) // Faster update every 100ms for very responsive following

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

  // Helper functions for distance and area calculation
  const calculateDistance = (coordinates: number[][]): number => {
    // Implement distance calculation logic here
    return 0
  }

  const calculateArea = (coordinates: number[][]): number => {
    // Implement area calculation logic here
    return 0
  }

  const renderUserCursors = useCallback(() => {
    const map = mapRef.current
    if (!map || !hasAccess) return

    // Get current active users (except current user)
    const activeUsers = users.filter((user) => user.id !== currentUser?.uid && user.active && user.isBroadcastingCursor)

    // Remove markers for users who are no longer active
    Object.keys(userCursorsRef.current).forEach((userId) => {
      const userExists = activeUsers.find((u) => u.id === userId)
      if (!userExists) {
        map.removeLayer(userCursorsRef.current[userId])
        delete userCursorsRef.current[userId]
      }
    })

    // Update or create markers for active users
    activeUsers.forEach((user) => {
      const existingMarker = userCursorsRef.current[user.id]

      if (existingMarker) {
        // Update existing marker position without recreating
        existingMarker.setLatLng([user.lat, user.lng])

        const currentHtml = existingMarker.getElement()?.innerHTML
        const newHtml = `
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
              ${user.name || "Anonim"}
            </div>
          </div>
        `

        if (existingMarker.getElement() && currentHtml !== newHtml) {
          existingMarker.getElement()!.innerHTML = newHtml
        }
      } else {
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
                ${user.name || "Anonim"}
              </div>
            </div>
          `,
          iconSize: [24, 40],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([user.lat, user.lng], { icon: cursorIcon }).addTo(map)

        userCursorsRef.current[user.id] = marker
      }
    })
  }, [users, currentUser, hasAccess])

  return <div id="mapDiv" ref={mapContainerRef} className="relative z-0" />
})
