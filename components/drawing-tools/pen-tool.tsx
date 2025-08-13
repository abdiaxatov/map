"use client"

import type React from "react"
import { useRef } from "react"
import L from "leaflet"

interface PenToolProps {
  mapRef: React.RefObject<L.Map>
  drawingColor: string
  onAddMapObject: (newObject: any) => Promise<string | null>
  onUpdateMapObject: (objectId: string, updates: any) => Promise<void>
  onAddDrawingCoordinate: (objectId: string, lat: number, lng: number) => Promise<void>
}

export const PenTool = ({
  mapRef,
  drawingColor,
  onAddMapObject,
  onUpdateMapObject,
  onAddDrawingCoordinate,
}: PenToolProps) => {
  const currentDrawingObjectId = useRef<string | null>(null)
  const isMouseDown = useRef(false)
  const drawingPath = useRef<L.Polyline | null>(null)

  const handleMouseDown = async (e: L.LeafletMouseEvent) => {
    if (!mapRef.current) return

    isMouseDown.current = true
    const { lat, lng } = e.latlng
    const roundedLat = Number.parseFloat(lat.toFixed(5))
    const roundedLng = Number.parseFloat(lng.toFixed(5))

    drawingPath.current = L.polyline([[roundedLat, roundedLng]], {
      color: drawingColor,
      weight: 3,
      opacity: 0.8,
    }).addTo(mapRef.current)

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      initlat: roundedLat,
      initlng: roundedLng,
      type: "draw",
      name: "Chiziq",
      desc: "",
      distance: 0,
      area: 0,
    })

    if (newObjectId) {
      currentDrawingObjectId.current = newObjectId
      onAddDrawingCoordinate(newObjectId, roundedLat, roundedLng)
    }
  }

  const handleMouseMove = (e: L.LeafletMouseEvent) => {
    if (isMouseDown.current && currentDrawingObjectId.current && drawingPath.current) {
      const { lat, lng } = e.latlng
      const roundedLat = Number.parseFloat(lat.toFixed(5))
      const roundedLng = Number.parseFloat(lng.toFixed(5))

      const currentLatLngs = drawingPath.current.getLatLngs() as L.LatLng[]
      currentLatLngs.push(L.latLng(roundedLat, roundedLng))
      drawingPath.current.setLatLngs(currentLatLngs)

      onAddDrawingCoordinate(currentDrawingObjectId.current, roundedLat, roundedLng)
    }
  }

  const handleMouseUp = () => {
    isMouseDown.current = false
    if (currentDrawingObjectId.current) {
      onUpdateMapObject(currentDrawingObjectId.current, { completed: true })
      currentDrawingObjectId.current = null
    }

    if (drawingPath.current && mapRef.current) {
      mapRef.current.removeLayer(drawingPath.current)
      drawingPath.current = null
    }
  }

  return { handleMouseDown, handleMouseMove, handleMouseUp }
}
