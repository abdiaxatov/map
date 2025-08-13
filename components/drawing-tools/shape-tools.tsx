import type React from "react"
import L from "leaflet"

interface ShapeToolsProps {
  mapRef: React.RefObject<L.Map>
  drawingColor: string
  onAddMapObject: (newObject: any) => Promise<string | null>
  onUpdateMapObject: (objectId: string, updates: any) => Promise<void>
  onToolComplete: () => void
}

export const ShapeTools = ({
  mapRef,
  drawingColor,
  onAddMapObject,
  onUpdateMapObject,
  onToolComplete,
}: ShapeToolsProps) => {
  const createCircle = async (lat: number, lng: number) => {
    if (!mapRef.current) return

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "circle",
      name: "Circle",
      desc: "",
      radius: 100,
    })

    if (newObjectId) {
      const circle = L.circle([lat, lng], {
        color: drawingColor,
        fillColor: drawingColor,
        fillOpacity: 0.3,
        radius: 100,
      }).addTo(mapRef.current)

      showShapeModal(circle, newObjectId, "Circle", "", lat, lng)
    }
  }

  const createTriangle = async (lat: number, lng: number) => {
    if (!mapRef.current) return

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "triangle",
      name: "Triangle",
      desc: "",
    })

    if (newObjectId) {
      const trianglePoints: [number, number][] = [
        [lat + 0.001, lng],
        [lat - 0.001, lng - 0.001],
        [lat - 0.001, lng + 0.001],
      ]

      const triangle = L.polygon(trianglePoints, {
        color: drawingColor,
        fillColor: drawingColor,
        fillOpacity: 0.3,
      }).addTo(mapRef.current)

      showShapeModal(triangle, newObjectId, "Triangle", "", lat, lng)
    }
  }

  const createPolygon = async (lat: number, lng: number) => {
    if (!mapRef.current) return

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "polygon",
      name: "Polygon",
      desc: "",
    })

    if (newObjectId) {
      const polygonPoints: [number, number][] = [
        [lat + 0.002, lng],
        [lat + 0.001, lng + 0.002],
        [lat - 0.001, lng + 0.002],
        [lat - 0.002, lng],
        [lat - 0.001, lng - 0.002],
        [lat + 0.001, lng - 0.002],
      ]

      const polygon = L.polygon(polygonPoints, {
        color: drawingColor,
        fillColor: drawingColor,
        fillOpacity: 0.3,
      }).addTo(mapRef.current)

      showShapeModal(polygon, newObjectId, "Polygon", "", lat, lng)
    }
  }

  const createStar = async (lat: number, lng: number) => {
    if (!mapRef.current) return

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "star",
      name: "Star",
      desc: "",
    })

    if (newObjectId) {
      const starPoints: [number, number][] = []
      const outerRadius = 0.002
      const innerRadius = 0.001
      const numPoints = 5

      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI) / numPoints
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const x = lat + radius * Math.cos(angle - Math.PI / 2)
        const y = lng + radius * Math.sin(angle - Math.PI / 2)
        starPoints.push([x, y])
      }

      const star = L.polygon(starPoints, {
        color: drawingColor,
        fillColor: drawingColor,
        fillOpacity: 0.3,
      }).addTo(mapRef.current)

      showShapeModal(star, newObjectId, "Star", "", lat, lng)
    }
  }

  const createHeart = async (lat: number, lng: number) => {
    if (!mapRef.current) return

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "heart",
      name: "Heart",
      desc: "",
    })

    if (newObjectId) {
      const heartPoints: [number, number][] = []
      const scale = 0.001

      // Create heart shape points
      for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        const x = 16 * Math.pow(Math.sin(t), 3)
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
        heartPoints.push([lat + y * scale, lng + x * scale])
      }

      const heart = L.polygon(heartPoints, {
        color: drawingColor,
        fillColor: drawingColor,
        fillOpacity: 0.3,
      }).addTo(mapRef.current)

      showShapeModal(heart, newObjectId, "Heart", "", lat, lng)
    }
  }

  const showShapeModal = (
    shape: L.Layer,
    objectId: string,
    defaultName: string,
    defaultDesc: string,
    lat: number,
    lng: number,
  ) => {
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "shape-modal-marker",
        html: "",
        iconSize: [0, 0],
      }),
      interactive: false,
    }).addTo(mapRef.current!)

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

    const tooltipContainer = marker.getTooltip()?.getElement()
    if (tooltipContainer) {
      const saveButton = tooltipContainer.querySelector(".save-button")
      const cancelButton = tooltipContainer.querySelector(".cancel-button")

      const handleSave = async () => {
        const name = (tooltipContainer.querySelector("#shape-name") as HTMLInputElement)?.value
        const desc = (tooltipContainer.querySelector("#shape-desc") as HTMLTextAreaElement)?.value
        await onUpdateMapObject(objectId, {
          name: name || defaultName,
          desc: desc || "",
          completed: true,
        })
        marker.remove()
        onToolComplete()
      }

      const handleCancel = () => {
        shape.remove()
        marker.remove()
        onToolComplete()
      }

      saveButton?.addEventListener("click", handleSave)
      cancelButton?.addEventListener("click", handleCancel)
    }
  }

  return { createCircle, createTriangle, createPolygon, createStar, createHeart }
}
