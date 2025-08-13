"use client"

import type React from "react"

import { useRef } from "react"
import L from "leaflet"

interface MarkerToolProps {
  mapRef: React.RefObject<L.Map>
  drawingColor: string
  onAddMapObject: (newObject: any) => Promise<string | null>
  onUpdateMapObject: (objectId: string, updates: any) => Promise<void>
  onToolComplete: () => void
}

export const MarkerTool = ({
  mapRef,
  drawingColor,
  onAddMapObject,
  onUpdateMapObject,
  onToolComplete,
}: MarkerToolProps) => {
  const activeMarkerRef = useRef<L.Marker | null>(null)

  const createMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "marker",
      name: "Marker",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 24px; height: 32px; background: ${drawingColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 8px solid ${drawingColor};"></div></div>`,
          iconSize: [24, 32],
          iconAnchor: [12, 32],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Marker", "")
    }
  }

  const createTextMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "text",
      name: "Text",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 30px; height: 30px; background: ${drawingColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📝</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Text", "")
    }
  }

  const createBrushMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "brush",
      name: "Brush",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 30px; height: 30px; background: ${drawingColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🖌️</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Brush", "")
    }
  }

  const createHighlighterMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "highlighter",
      name: "Highlighter",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 30px; height: 30px; background: ${drawingColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🖍️</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Highlighter", "")
    }
  }

  const createRulerMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "ruler",
      name: "Ruler",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 30px; height: 30px; background: ${drawingColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📏</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Ruler", "")
    }
  }

  const createCompassMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "compass",
      name: "Compass",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 30px; height: 30px; background: ${drawingColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🧭</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Compass", "")
    }
  }

  const createCrosshairMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "crosshair",
      name: "Crosshair",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 30px; height: 30px; background: ${drawingColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎯</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Crosshair", "")
    }
  }

  const createArrowMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "arrow",
      name: "Arrow",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 30px; height: 30px; background: ${drawingColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">➡️</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Arrow", "")
    }
  }

  const createFillMarker = async (lat: number, lng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove()
      activeMarkerRef.current = null
    }

    const newObjectId = await onAddMapObject({
      color: drawingColor,
      lat: lat,
      lng: lng,
      type: "marker",
      m_type: "fill",
      name: "Fill",
      desc: "",
    })

    if (newObjectId && mapRef.current) {
      const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="width: 30px; height: 30px; background: ${drawingColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎨</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 9999,
        interactive: false,
      }).addTo(mapRef.current)

      activeMarkerRef.current = tempMarker
      showMarkerModal(tempMarker, newObjectId, "Fill", "")
    }
  }

  const showMarkerModal = (marker: L.Marker, objectId: string, defaultName: string, defaultDesc: string) => {
    marker.bindTooltip(
      `
      <div class="marker-modal-content">
        <label for="shape-name">Name</label>
        <input value="${defaultName}" id="shape-name" name="shape-name" type="text" />
        <label for="shape-desc">Description</label>
        <textarea id="shape-desc" name="description" rows="3">${defaultDesc}</textarea>
        <div id="buttons">
          <button class="cancel-button" type="button">Cancel</button>
          <button class="save-button" type="button">Save</button>
        </div>
        <div class="arrow-down"></div>
      </div>
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
        // Ensure input is editable
        nameInput.readOnly = false
        nameInput.disabled = false
      }
    }, 100)

    const tooltipContainer = marker.getTooltip()?.getElement()
    if (tooltipContainer) {
      const modalContent = tooltipContainer.querySelector(".marker-modal-content")
      if (modalContent) {
        modalContent.addEventListener("click", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })

        modalContent.addEventListener("mousedown", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })

        modalContent.addEventListener("mouseup", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
      }

      const saveButton = tooltipContainer.querySelector(".save-button")
      const cancelButton = tooltipContainer.querySelector(".cancel-button")

      const handleSave = async () => {
        const name = (tooltipContainer.querySelector("#shape-name") as HTMLInputElement)?.value
        const desc = (tooltipContainer.querySelector("#shape-desc") as HTMLTextAreaElement)?.value

        try {
          await onUpdateMapObject(objectId, {
            name: name || defaultName,
            desc: desc || "", // Keep using 'desc' field for consistency
            description: desc || "", // Also add 'description' field for compatibility
            completed: true,
          })
          marker.closeTooltip()
          marker.remove()
          activeMarkerRef.current = null
          onToolComplete()
        } catch (error) {
          console.error("Error saving marker:", error)
        }
      }

      const handleCancel = async () => {
        try {
          marker.remove()
          activeMarkerRef.current = null
          onToolComplete()
        } catch (error) {
          console.error("Error cancelling marker:", error)
        }
      }

      const handleKeyPress = (e: KeyboardEvent) => {
        e.stopPropagation()
        e.stopImmediatePropagation()
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          handleSave()
        } else if (e.key === "Escape") {
          e.preventDefault()
          handleCancel()
        }
      }

      const nameInput = tooltipContainer.querySelector("#shape-name") as HTMLInputElement
      const descInput = tooltipContainer.querySelector("#shape-desc") as HTMLTextAreaElement

      if (nameInput) {
        nameInput.addEventListener("click", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
        nameInput.addEventListener("focus", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
        nameInput.addEventListener("input", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
        nameInput.addEventListener("keydown", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
          handleKeyPress(e)
        })
        nameInput.addEventListener("keyup", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
        nameInput.addEventListener("keypress", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
      }

      if (descInput) {
        descInput.addEventListener("click", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
        descInput.addEventListener("focus", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
        descInput.addEventListener("input", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
        descInput.addEventListener("keydown", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
          handleKeyPress(e)
        })
        descInput.addEventListener("keyup", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
        descInput.addEventListener("keypress", (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        })
      }

      saveButton?.addEventListener("click", (e) => {
        e.stopPropagation()
        e.stopImmediatePropagation()
        handleSave()
      })
      cancelButton?.addEventListener("click", (e) => {
        e.stopPropagation()
        e.stopImmediatePropagation()
        handleCancel()
      })
    }
  }

  return {
    createMarker,
    createTextMarker,
    createBrushMarker,
    createHighlighterMarker,
    createRulerMarker,
    createCompassMarker,
    createCrosshairMarker,
    createArrowMarker,
    createFillMarker,
  }
}
