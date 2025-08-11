"use client"

import type React from "react"

import type { User } from "firebase/auth"
import type { UserCursor, MapObject, RoomDetails } from "@/hooks/use-map-data" // RoomDetails import qilindi
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react"
import L from "leaflet"
import "@geoman-io/leaflet-geoman-free" // This imports the plugin and extends L
import * as turf from "@turf/turf" // Changed to import all as turf

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
  currentSession: number | null
  users: UserCursor[]
  objects: MapObject[]
  activeTool: "cursor" | "pen" | "eraser" | "marker" | "area" | "path"
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
}

export interface MapComponentRef {
  panTo: (lat: number, lng: number, zoom?: number) => void
  focusLayer: (objectId: string) => void
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
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 22H22L12 2Z" fill="currentColor"/></svg>`,
  // 3. Filled Circle
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>`,
  // 4. Filled Square
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" fill="currentColor"/></svg>`,
  // 5. Filled Diamond
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 12L12 22L22 12L12 2Z" fill="currentColor"/></svg>`,
  // 6. Filled Star
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>`,
  // 7. Filled Plus
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 2H13V11H22V13H13V22H11V13H2V11H11V2Z" fill="currentColor"/></svg>`,
  // 8. Filled Hexagon
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="currentColor"/></svg>`,
  // 9. Filled Pentagon
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 9H22L17 20H7L12 2Z" fill="currentColor"/></svg>`,
  // 10. Filled Octagon
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2H16L22 8V16L16 22H8L2 16V8L8 2Z" fill="currentColor"/></svg>`,
]

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

    const timeoutId = setTimeout(() => {
      if (map && (map as any).pm && typeof (map as any).pm.setOptIn === "function") {
        ;(map as any).pm.setOptIn(true)
        ;(map as any).pm.setGlobalOptions({
          pinning: true,
          snappable: true,
          allowSelfIntersection: false,
        })
        setGeomanLoaded(true)
      } else {
        console.warn(
          "Leaflet-Geoman plugin (pm) or its setOptIn method not fully available. Retrying initialization...",
        )
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [mapRef.current, geomanLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasAccess) return

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      const roundedLat = Number.parseFloat(lat.toFixed(5))
      const roundedLng = Number.parseFloat(lng.toFixed(5))

      const lastUpdate = Date.now()
      if (lastUpdate - (window as any).lastCursorUpdate < 100) return
      ;(window as any).lastCursorUpdate = lastUpdate

      if (currentUser) {
        onUpdateCurrentUserLocation(roundedLat, roundedLng, [map.getCenter().lat, map.getCenter().lng], map.getZoom())
      }

      if (drawingHintMarkerRef.current) {
        drawingHintMarkerRef.current.setLatLng([roundedLat, roundedLng])
      }

      if (isMouseDown.current && activeTool === "pen" && currentDrawingObjectId.current) {
        const currentObject = mapObjectsRef.current.find((obj) => obj.id === currentDrawingObjectId.current)
        if (currentObject && currentObject.leafletLayer instanceof L.Polyline) {
          currentObject.leafletLayer.addLatLng([roundedLat, roundedLng])
          onAddDrawingCoordinate(currentDrawingObjectId.current, roundedLat, roundedLng)
        }
      }

      if (activeTool === "path" && currentDrawingLastCoord.current) {
        const distance = currentDrawingLineDistance.current + currentDrawingLastCoord.current.distanceTo(e.latlng)
        if (drawingHintMarkerRef.current) {
          drawingHintMarkerRef.current.setTooltipContent(`${(distance / 1000).toFixed(2)}km | Double click to finish`)
        }
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
            }).addTo(map)
            tempMarker.setOpacity(0)
            tempMarker.addTo(map)

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
      }
    }

    const handleZoom = () => {
      if (currentUser) {
        onUpdateCurrentUserLocation(
          map.getCenter().lat,
          map.getCenter().lng,
          [map.getCenter().lat, map.getCenter().lng],
          map.getZoom(),
        )
      }
    }

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

    const handleDrawStart = ({ workingLayer, shape }: any) => {
      if (drawingHintMarkerRef.current) {
        drawingHintMarkerRef.current.openTooltip()
        drawingHintMarkerRef.current.setTooltipContent("Click to place first vertex")
      }

      workingLayer.on("pm:vertexadded", async (e: any) => {
        const { lat, lng } = e.latlng
        const roundedLat = Number.parseFloat(lat.toFixed(5))
        const roundedLng = Number.parseFloat(lng.toFixed(5))

        if (shape === "Polygon") {
          if (e.layer._latlngs[0].length === 1) {
            const newObjectId = await onAddMapObject({
              color: drawingColor,
              initlat: roundedLat,
              initlng: roundedLng,
              type: "area",
              name: "Area",
              desc: "",
              distance: 0,
              area: 0,
            })
            if (newObjectId) {
              currentDrawingObjectId.current = newObjectId
              onAddDrawingCoordinate(newObjectId, roundedLat, roundedLng)
            }
          } else {
            onAddDrawingCoordinate(currentDrawingObjectId.current!, roundedLat, roundedLng)
            if (drawingHintMarkerRef.current) {
              drawingHintMarkerRef.current.setTooltipContent("Click on first vertex to finish")
            }
          }
        } else if (shape === "Line") {
          if (e.layer._latlngs.length === 1) {
            const newObjectId = await onAddMapObject({
              color: drawingColor,
              initlat: roundedLat,
              initlng: roundedLng,
              type: "line",
              name: "Line",
              desc: "",
              distance: 0,
            })
            if (newObjectId) {
              currentDrawingObjectId.current = newObjectId
              onAddDrawingCoordinate(newObjectId, roundedLat, roundedLng)
            }
          } else {
            onAddDrawingCoordinate(currentDrawingObjectId.current!, roundedLat, roundedLng)
            currentDrawingLineDistance.current = 0
            e.layer._latlngs.forEach((coord: L.LatLng, index: number) => {
              if (index !== 0) {
                currentDrawingLineDistance.current += e.layer._latlngs[index - 1].distanceTo(coord)
              }
            })
            if (drawingHintMarkerRef.current) {
              drawingHintMarkerRef.current.setTooltipContent(
                `${(currentDrawingLineDistance.current / 1000).toFixed(2)}km | Double click to finish`,
              )
            }
          }
          currentDrawingLastCoord.current = e.latlng
        }
      })
    }

    const handleDrawEnd = () => {
      if (drawingHintMarkerRef.current) {
        drawingHintMarkerRef.current.closeTooltip()
      }
      currentDrawingObjectId.current = null
      currentDrawingLineDistance.current = 0
      currentDrawingLastCoord.current = null
      ;(map as any).pm.disableDraw()
    }

    const handleCreate = async (e: any) => {
      const layer = e.layer
      const shape = e.shape

      if (!currentDrawingObjectId.current) {
        console.warn("No currentDrawingObjectId for created layer. Skipping form.")
        layer.remove()
        return
      }

      const objectId = currentDrawingObjectId.current
      const currentObject = mapObjectsRef.current.find((obj) => obj.id === objectId)

      if (!currentObject) {
        console.error("Map object not found for ID:", objectId)
        layer.remove()
        return
      }

      let distance = 0
      let area = 0
      let path: [number, number][] = []

      if (shape === "Polygon") {
        const geoJson = layer.toGeoJSON()
        distance = Number.parseFloat(turf.length(geoJson).toFixed(2))
        area = Number.parseFloat((turf.area(geoJson) * 0.000001).toFixed(2))
        path = layer.getLatLngs()[0].map((ll: L.LatLng) => [ll.lat, ll.lng])
      } else if (shape === "Line") {
        const geoJson = layer.toGeoJSON()
        distance = Number.parseFloat(turf.length(geoJson).toFixed(2))
        path = layer.getLatLngs().map((ll: L.LatLng) => [ll.lat, ll.lng])
      }

      await onUpdateMapObject(objectId, {
        distance,
        area,
        path,
        completed: true,
      })

      const centerLatLng = shape === "Polygon" ? layer.getBounds().getCenter() : layer.getCenter()
      const tempMarker = L.marker(centerLatLng, {
        zIndexOffset: 9999,
        interactive: false,
        pane: "overlayPane",
      })
      tempMarker.setOpacity(0)
      tempMarker.addTo(map)

      tempMarker.bindTooltip(
        `
        <label for="shape-name">Name</label>
        <input value="${sanitize(currentObject.name)}" id="shape-name" name="shape-name" />
        <label for="shape-desc">Description</label>
        <textarea id="shape-desc" name="description">${sanitize(currentObject.desc)}</textarea>
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
          offset: L.point({ x: shape === "marker" ? 0 : -15, y: shape === "marker" ? -35 : 18 }),
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
          await onUpdateMapObject(objectId, {
            name: sanitize(name || currentObject.name),
            desc: sanitize(desc || currentObject.desc),
            completed: true,
          })
          tempMarker.closeTooltip()
          tempMarker.remove()
        }

        const handleCancel = async () => {
          await onUpdateMapObject(objectId, { completed: true })
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

      const existingObject = mapObjectsRef.current.find((obj) => obj.id === objectId)
      if (existingObject) {
        existingObject.leafletLayer = layer
        existingObject.triggerMarker = tempMarker
      }
    }

    map.on("pm:drawstart", handleDrawStart)
    map.on("pm:drawend", handleDrawEnd)
    map.on("pm:create", handleCreate)

    return () => {
      map.off("pm:drawstart", handleDrawStart)
      map.off("pm:drawend", handleDrawEnd)
      map.off("pm:create", handleCreate)
    }
  }, [
    currentUser,
    roomId,
    drawingColor,
    onAddMapObject,
    onUpdateMapObject,
    onAddDrawingCoordinate,
    geomanLoaded,
    hasAccess,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !geomanLoaded || !(map as any).pm) return // Clear all previous drawing modes
    ;(map as any).pm.disableDraw()
    ;(map as any).pm.disableGlobalRemovalMode()
    map.dragging.enable()

    // Remove drawing hint marker when switching tools
    if (drawingHintMarkerRef.current && activeTool !== "area" && activeTool !== "path") {
      map.removeLayer(drawingHintMarkerRef.current)
      drawingHintMarkerRef.current = null
    }

    switch (activeTool) {
      case "cursor":
        // Default cursor mode - enable map dragging
        map.dragging.enable()
        break
      case "pen":
        // Free drawing mode
        map.dragging.disable()
        if (!drawingHintMarkerRef.current) {
          drawingHintMarkerRef.current = L.marker([0, 0], {
            icon: L.divIcon({
              className: "drawing-hint-marker",
              html: `<div style="width: 8px; height: 8px; background: ${drawingColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            }),
            interactive: false,
            zIndexOffset: 10000,
          }).addTo(map)
        }
        break
      case "eraser":
        // Enable removal mode
        ;(map as any).pm.enableGlobalRemovalMode()
        break
      case "marker":
        // Marker placement mode
        map.dragging.enable()
        break
      case "area":
        // Polygon drawing mode
        map.dragging.disable()
        ;(map as any).pm.setPathOptions({
          color: drawingColor,
          fillColor: drawingColor,
          fillOpacity: 0.4,
        })
        ;(map as any).pm.enableDraw("Polygon", {
          tooltips: false,
          snappable: true,
          templineStyle: { color: drawingColor },
          hintlineStyle: { color: drawingColor, dashArray: [5, 5] },
          pmIgnore: false,
        })

        // Add drawing hint marker for area
        if (!drawingHintMarkerRef.current) {
          drawingHintMarkerRef.current = L.marker([0, 0], {
            icon: L.divIcon({
              className: "drawing-hint-marker",
              html: `<div style="width: 8px; height: 8px; background: ${drawingColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            }),
            interactive: false,
            zIndexOffset: 10000,
          }).addTo(map)
          drawingHintMarkerRef.current.bindTooltip("Click to start drawing area", {
            permanent: false,
            direction: "top",
            offset: [0, -10],
          })
        }
        break
      case "path":
        // Line drawing mode
        map.dragging.disable()
        ;(map as any).pm.setPathOptions({
          color: drawingColor,
          fillColor: drawingColor,
          fillOpacity: 0.4,
        })
        ;(map as any).pm.enableDraw("Line", {
          tooltips: false,
          snappable: true,
          templineStyle: { color: drawingColor },
          hintlineStyle: { color: drawingColor, dashArray: [5, 5] },
          pmIgnore: false,
          finishOn: "dblclick",
        })

        // Add drawing hint marker for line
        if (!drawingHintMarkerRef.current) {
          drawingHintMarkerRef.current = L.marker([0, 0], {
            icon: L.divIcon({
              className: "drawing-hint-marker",
              html: `<div style="width: 8px; height: 8px; background: ${drawingColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            }),
            interactive: false,
            zIndexOffset: 10000,
          }).addTo(map)
          drawingHintMarkerRef.current.bindTooltip("Click to start drawing line", {
            permanent: false,
            direction: "top",
            offset: [0, -10],
          })
        }
        break
    }
  }, [activeTool, drawingColor, geomanLoaded, hasAccess, currentUser])

  // Render/update other users' cursors
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    Object.keys(userCursorsRef.current).forEach((userId) => {
      if (!users.some((u) => u.id === userId && u.active && u.isBroadcastingCursor)) {
        map.removeLayer(userCursorsRef.current[userId])
        delete userCursorsRef.current[userId]
      }
    })

    users.forEach((userCursor) => {
      if (
        userCursor.id !== currentUser?.uid &&
        userCursor.active &&
        userCursor.isBroadcastingCursor &&
        typeof userCursor.lat === "number" &&
        typeof userCursor.lng === "number" &&
        userCursor.name &&
        userCursor.color &&
        userCursor.lat !== 0 &&
        userCursor.lng !== 0 &&
        userCursor.cursorShapeIndex !== undefined
      ) {
        const safeColor = userCursor.color
        const cursorSvg = cursorSvgPaths[userCursor.cursorShapeIndex % cursorSvgPaths.length]
        const isAdmin = mapDetails?.admin === userCursor.id

        if (!userCursorsRef.current[userCursor.id]) {
          const cursorIcon = L.divIcon({
            html: `<div style="color: ${safeColor};" class="cursoricon ${isAdmin ? "admin-cursor" : ""}">${cursorSvg}</div>`,
            className: "cursoricon-wrapper",
            iconSize: [24, 24],
            iconAnchor: [0, 0],
          })
          const cursorInstance = L.marker([userCursor.lat, userCursor.lng], {
            icon: cursorIcon,
            pane: "markerPane",
            zIndexOffset: 1000,
          }).addTo(map)

          cursorInstance
            .bindTooltip(userCursor.name + (isAdmin ? " (Admin)" : ""), {
              permanent: true,
              offset: [10, -20],
              className: "cursor-label",
              direction: "right",
            })
            .openTooltip()

          const tooltipElement = cursorInstance.getTooltip()?.getElement()
          if (tooltipElement) {
            tooltipElement.style.setProperty("--cursor-label-bg", safeColor)
          }

          userCursorsRef.current[userCursor.id] = cursorInstance
        } else {
          userCursorsRef.current[userCursor.id].setLatLng([userCursor.lat, userCursor.lng])
          userCursorsRef.current[userCursor.id].getTooltip()?.setContent(userCursor.name + (isAdmin ? " (Admin)" : ""))
          const tooltipElement = userCursorsRef.current[userCursor.id].getTooltip()?.getElement()
          if (tooltipElement) {
            tooltipElement.style.setProperty("--cursor-label-bg", safeColor)
          }
          const iconElement = userCursorsRef.current[userCursor.id].getElement()?.querySelector(".cursoricon")
          if (iconElement) {
            if (isAdmin) {
              iconElement.classList.add("admin-cursor")
            } else {
              iconElement.classList.remove("admin-cursor")
            }
          }
        }
      } else {
        if (userCursorsRef.current[userCursor.id]) {
          map.removeLayer(userCursorsRef.current[userCursor.id])
          delete userCursorsRef.current[userCursor.id]
        }
      }
    })
  }, [users, currentUser?.uid, mapDetails?.admin])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !observingUser) return

    if (
      map.getZoom() !== observingUser.zoom ||
      map.getCenter().lat !== observingUser.view[0] ||
      map.getCenter().lng !== observingUser.view[1]
    ) {
      map.flyTo(new L.LatLng(observingUser.view[0], observingUser.view[1]), observingUser.zoom, {
        animate: true,
        duration: 0.5,
      })
    }
  }, [observingUser])

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

    const zoomInButton = document.getElementById("zoom-in")
    const zoomOutButton = document.getElementById("zoom-out")

    const handleZoomIn = () => map.zoomIn()
    const handleZoomOut = () => map.zoomOut()

    zoomInButton?.addEventListener("click", handleZoomIn)
    zoomOutButton?.addEventListener("click", handleZoomOut)

    return () => {
      zoomInButton?.removeEventListener("click", handleZoomIn)
      zoomOutButton?.removeEventListener("click", handleZoomOut)
    }
  }, [hasAccess])

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

  return <div id="mapDiv" ref={mapContainerRef} className="relative z-0" />
})
