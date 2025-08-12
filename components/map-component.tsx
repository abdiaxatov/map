"use client"

import type React from "react"
import type { User, Session } from "firebase/auth"
import type { UserCursor, MapObject, RoomDetails } from "@/hooks/use-map-data"
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react"
import L from "leaflet"
import "@geoman-io/leaflet-geoman-free"

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

    const { lat, lng } = e.latlng
    const roundedLat = Number.parseFloat(lat.toFixed(5))
    const roundedLng = Number.parseFloat(lng.toFixed(5))

    switch (activeTool) {
      case "marker":
        createMarker(roundedLat, roundedLng)
        break
      case "text":
        createTextMarker(roundedLat, roundedLng)
        break
      case "brush":
        createBrushStroke(roundedLat, roundedLng)
        break
      case "highlighter":
        createHighlighter(roundedLat, roundedLng)
        break
      case "ruler":
        createRuler(roundedLat, roundedLng)
        break
      case "compass":
        createCompass(roundedLat, roundedLng)
        break
      case "area-measure":
        createAreaMeasure(roundedLat, roundedLng)
        break
      case "crosshair":
        createCrosshair(roundedLat, roundedLng)
        break
      case "arrow":
        createArrow(roundedLat, roundedLng)
        break
      case "fill":
        createFillArea(roundedLat, roundedLng)
        break
    }
  }

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
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 24px; height: 24px; background: ${drawingColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 8px solid ${drawingColor};"></div></div>`,
          iconSize: [24, 32],
          iconAnchor: [12, 32],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current!)

      showMarkerModal(tempMarker, newObjectId, "Marker", "")
    }
  }

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
      }).addTo(mapRef.current!)

      showTextModal(textMarker, newObjectId)
    }
  }

  const createBrushStroke = async (lat: number, lng: number) => {
    const newObjectId = await onAddMapObject({
      color: drawingColor,
      initlat: lat,
      initlng: lng,
      type: "brush",
      name: "Brush Stroke",
      desc: "",
    })

    if (newObjectId) {
      currentDrawingObjectId.current = newObjectId
      onAddDrawingCoordinate(newObjectId, lat, lng)
    }
  }

  const createHighlighter = async (lat: number, lng: number) => {
    const newObjectId = await onAddMapObject({
      color: drawingColor + "80",
      initlat: lat,
      initlng: lng,
      type: "highlighter",
      name: "Highlight",
      desc: "",
    })

    if (newObjectId) {
      currentDrawingObjectId.current = newObjectId
      onAddDrawingCoordinate(newObjectId, lat, lng)
    }
  }

  const createRuler = async (lat: number, lng: number) => {
    const newObjectId = await onAddMapObject({
      color: "#ff0000",
      initlat: lat,
      initlng: lng,
      type: "ruler",
      name: "Measurement",
      desc: "",
    })

    if (newObjectId) {
      currentDrawingObjectId.current = newObjectId
      onAddDrawingCoordinate(newObjectId, lat, lng)
    }
  }

  const createCompass = async (lat: number, lng: number) => {
    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "compass",
      name: "Compass Point",
      desc: "",
    })

    if (newObjectId) {
      const compassMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "compass-marker",
          html: `<div style="width: 32px; height: 32px; background: ${drawingColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">N</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
        zIndexOffset: 9999,
      }).addTo(mapRef.current!)

      showMarkerModal(compassMarker, newObjectId, "Compass Point", "")
    }
  }

  const createAreaMeasure = async (lat: number, lng: number) => {
    const newObjectId = await onAddMapObject({
      color: "#00ff00",
      initlat: lat,
      initlng: lng,
      type: "area-measure",
      name: "Area Measurement",
      desc: "",
    })

    if (newObjectId) {
      currentDrawingObjectId.current = newObjectId
      onAddDrawingCoordinate(newObjectId, lat, lng)
    }
  }

  const createCrosshair = async (lat: number, lng: number) => {
    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "crosshair",
      name: "Crosshair",
      desc: "",
    })

    if (newObjectId) {
      const crosshairMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "crosshair-marker",
          html: `<div style="width: 24px; height: 24px; position: relative;"><div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: ${drawingColor}; transform: translateY(-50%);"></div><div style="position: absolute; left: 50%; top: 0; height: 100%; width: 2px; background: ${drawingColor}; transform: translateX(-50%);"></div></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        zIndexOffset: 9999,
      }).addTo(mapRef.current!)

      showMarkerModal(crosshairMarker, newObjectId, "Crosshair", "")
    }
  }

  const createArrow = async (lat: number, lng: number) => {
    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "arrow",
      name: "Arrow",
      desc: "",
    })

    if (newObjectId) {
      const arrowMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "arrow-marker",
          html: `<div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 20px solid ${drawingColor}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></div>`,
          iconSize: [16, 20],
          iconAnchor: [8, 20],
        }),
        zIndexOffset: 9999,
      }).addTo(mapRef.current!)

      showMarkerModal(arrowMarker, newObjectId, "Arrow", "")
    }
  }

  const createFillArea = async (lat: number, lng: number) => {
    const newObjectId = await onAddMapObject({
      color: drawingColor,
      initlat: lat,
      initlng: lng,
      type: "fill",
      name: "Fill Area",
      desc: "",
    })

    if (newObjectId) {
      currentDrawingObjectId.current = newObjectId
      onAddDrawingCoordinate(newObjectId, lat, lng)
    }
  }

  const showMarkerModal = (marker: L.Marker, objectId: string, defaultName: string, defaultDesc: string) => {
    marker.bindTooltip(
      `
      <label for="shape-name">Name</label>
      <input value="${defaultName}" id="shape-name" name="shape-name" />
      <label for="shape-desc">Description</label>
      <textarea id="shape-desc" name="description">${defaultDesc}</textarea>
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
    marker.openTooltip()

    setTimeout(() => {
      const nameInput = document.getElementById("shape-name") as HTMLInputElement
      if (nameInput) {
        nameInput.focus()
        nameInput.select()
      }
    }, 0)

    const tooltipContainer = marker.getTooltip()?.getElement()
    if (tooltipContainer) {
      const saveButton = tooltipContainer.querySelector(".save-button")
      const cancelButton = tooltipContainer.querySelector(".cancel-button")

      const handleSave = async () => {
        const name = (tooltipContainer.querySelector("#shape-name") as HTMLInputElement)?.value
        const desc = (tooltipContainer.querySelector("#shape-desc") as HTMLTextAreaElement)?.value
        await onUpdateMapObject(objectId, {
          name: sanitize(name || defaultName),
          desc: sanitize(desc || ""),
          completed: true,
        })
        marker.closeTooltip()
      }

      const handleCancel = async () => {
        await onDeleteMapObject(objectId)
        marker.closeTooltip()
        marker.remove()
      }

      saveButton?.addEventListener("click", handleSave)
      cancelButton?.addEventListener("click", handleCancel)

      marker.on("tooltipclose", () => {
        saveButton?.removeEventListener("click", handleSave)
        cancelButton?.removeEventListener("click", handleCancel)
      })
    }
  }

  const showTextModal = (marker: L.Marker, objectId: string) => {
    marker.bindTooltip(
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
    marker.openTooltip()

    setTimeout(() => {
      const textInput = document.getElementById("text-content") as HTMLInputElement
      if (textInput) {
        textInput.focus()
        textInput.select()
      }
    }, 0)

    const tooltipContainer = marker.getTooltip()?.getElement()
    if (tooltipContainer) {
      const saveButton = tooltipContainer.querySelector(".save-button")
      const cancelButton = tooltipContainer.querySelector(".cancel-button")

      const handleSave = async () => {
        const textContent = (tooltipContainer.querySelector("#text-content") as HTMLInputElement)?.value
        const desc = (tooltipContainer.querySelector("#text-desc") as HTMLTextAreaElement)?.value

        marker.setIcon(
          L.divIcon({
            className: "text-marker",
            html: `<div style="background: white; padding: 4px 8px; border: 2px solid ${drawingColor}; border-radius: 4px; color: ${drawingColor}; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${textContent || "Text"}</div>`,
            iconSize: [Math.max(60, (textContent || "Text").length * 8 + 16), 30],
            iconAnchor: [Math.max(30, (textContent || "Text").length * 4 + 8), 15],
          }),
        )

        await onUpdateMapObject(objectId, {
          name: sanitize(textContent || "Text"),
          desc: sanitize(desc || ""),
          completed: true,
        })
        marker.closeTooltip()
      }

      const handleCancel = () => {
        marker.closeTooltip()
        marker.remove()
        onDeleteMapObject(objectId)
      }

      saveButton?.addEventListener("click", handleSave)
      cancelButton?.addEventListener("click", handleCancel)

      marker.on("tooltipclose", () => {
        saveButton?.removeEventListener("click", handleSave)
        cancelButton?.removeEventListener("click", handleCancel)
        marker.remove()
      })
    }
  }

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
    if (!map || !hasAccess) return

    map.on("mousemove", handleMouseMove)
    map.on("mousedown", handleMouseDown)
    map.on("mouseup", handleMouseUp)
    map.on("click", handleClick)

    return () => {
      map.off("mousemove", handleMouseMove)
      map.off("mousedown", handleMouseDown)
      map.off("mouseup", handleMouseUp)
      map.off("click", handleClick)
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
    if (!map || !geomanLoaded || !(map as any).pm || !hasAccess || !currentUser) return // Clean up previous tool state
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
        map.dragging.enable()
        break

      case "pen":
        map.dragging.disable()
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
        break

      case "marker":
        map.dragging.enable()
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
        break

      case "text":
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
        break

      default:
        console.log(`Tool ${activeTool} not fully implemented yet`)
        break
    }
  }, [activeTool, drawingColor, geomanLoaded, hasAccess, currentUser])

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
    if (!map || !hasAccess) return

    // Clear existing object layers
    mapObjectsRef.current.forEach((obj) => {
      if (obj.leafletLayer) {
        map.removeLayer(obj.leafletLayer)
      }
      if (obj.triggerMarker) {
        map.removeLayer(obj.triggerMarker)
      }
    })
    mapObjectsRef.current = []

    // Render all objects from all users
    objects.forEach((obj) => {
      const leafletObj: LeafletMapObject = { ...obj }

      if (obj.type === "marker" && obj.lat && obj.lng) {
        // Create marker icon based on m_type
        let iconHtml = "📍"
        if (obj.m_type === "text") iconHtml = "📝"
        else if (obj.m_type === "brush") iconHtml = "🖌️"
        else if (obj.m_type === "highlighter") iconHtml = "🖍️"
        else if (obj.m_type === "ruler") iconHtml = "📏"
        else if (obj.m_type === "compass") iconHtml = "🧭"
        else if (obj.m_type === "crosshair") iconHtml = "🎯"
        else if (obj.m_type === "arrow") iconHtml = "➡️"
        else if (obj.m_type === "fill") iconHtml = "🎨"

        const markerIcon = L.divIcon({
          className: "custom-marker-icon",
          html: `
            <div style="
              background: ${obj.color};
              color: white;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${iconHtml}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        const marker = L.marker([obj.lat, obj.lng], { icon: markerIcon }).addTo(map)

        // Add popup with object info
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: ${obj.color};">${obj.name || "Belgi"}</h4>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Yaratuvchi: ${obj.user}</p>
            ${obj.desc ? `<p style="margin: 0; font-size: 14px;">${obj.desc}</p>` : ""}
          </div>
        `)

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

          polyline.bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: ${obj.color};">${obj.name || "Chiziq"}</h4>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Yaratuvchi: ${obj.user}</p>
              ${obj.desc ? `<p style="margin: 0; font-size: 14px;">${obj.desc}</p>` : ""}
            </div>
          `)

          leafletObj.leafletLayer = polyline
        }
      } else if (obj.type === "line" && obj.path) {
        // Render line objects
        const polyline = L.polyline(obj.path, {
          color: obj.color,
          weight: 3,
          opacity: 0.8,
        }).addTo(map)

        polyline.bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: ${obj.color};">${obj.name || "Chiziq"}</h4>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Yaratuvchi: ${obj.user}</p>
            ${obj.distance ? `<p style="margin: 0 0 8px 0; font-size: 12px;">Masofa: ${obj.distance.toFixed(2)} km</p>` : ""}
            ${obj.desc ? `<p style="margin: 0; font-size: 14px;">${obj.desc}</p>` : ""}
          </div>
        `)

        leafletObj.leafletLayer = polyline
      } else if (obj.type === "area" && obj.path) {
        // Render area objects
        const polygon = L.polygon(obj.path, {
          color: obj.color,
          fillColor: obj.color,
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(map)

        polygon.bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: ${obj.color};">${obj.name || "Hudud"}</h4>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Yaratuvchi: ${obj.user}</p>
            ${obj.area ? `<p style="margin: 0 0 8px 0; font-size: 12px;">Maydon: ${obj.area.toFixed(2)} km²</p>` : ""}
            ${obj.desc ? `<p style="margin: 0; font-size: 14px;">${obj.desc}</p>` : ""}
          </div>
        `)

        leafletObj.leafletLayer = polygon
      }

      mapObjectsRef.current.push(leafletObj)
    })
  }, [objects, hasAccess])

  return <div id="mapDiv" ref={mapContainerRef} className="relative z-0" />
})
