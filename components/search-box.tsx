"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Search, MapPin } from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface SearchBoxProps {
  onSearchPanTo: (lat: number, lng: number, zoom?: number) => void
}

export function SearchBox({ onSearchPanTo }: SearchBoxProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsLoading(true)
    console.log("Searching for:", searchTerm)

    try {
      const query = encodeURIComponent(searchTerm.trim())
      
      // Try using the internal API first, fallback to direct API
      let response
      try {
        response = await fetch(`/api/geocode?q=${query}`)
      } catch (internalError) {
        console.log("Internal API failed, using direct API:", internalError)
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=8&addressdetails=1&accept-language=uz,ru,en&extratags=1&namedetails=1`,
          {
            headers: {
              'User-Agent': 'MapApp/1.0',
            },
          }
        )
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Raw API response:", data)

      if (data && Array.isArray(data) && data.length > 0) {
        setSearchResults(data)
        setShowResults(true)
        console.log("Search results found:", data.length)
      } else {
        setSearchResults([])
        setShowResults(false)
        console.log("No results found for:", searchTerm)
      }
    } catch (error) {
      console.error("Error during search:", error)
      setSearchResults([])
      setShowResults(false)
      
      // Show user-friendly error message
      alert("Qidirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResultClick = (result: any) => {
    console.log("Full result object:", result)

    const { lat, lon } = result
    const latitude = Number.parseFloat(lat)
    const longitude = Number.parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error("Invalid coordinates:", { lat, lon })
      return
    }

    let zoomLevel = 15

    console.log("Result details:", {
      type: result.type,
      class: result.class,
      place_rank: result.place_rank,
      importance: result.importance,
    })

    // Better zoom level detection
    if (result.class === "boundary" && result.type === "administrative") {
      if (result.place_rank <= 4)
        zoomLevel = 5 // Country level
      else if (result.place_rank <= 8)
        zoomLevel = 7 // State/Region level
      else if (result.place_rank <= 12) zoomLevel = 10 // City level
    } else if (result.class === "place") {
      if (result.type === "country") zoomLevel = 5
      else if (result.type === "state" || result.type === "region") zoomLevel = 7
      else if (result.type === "city" || result.type === "town") zoomLevel = 11
      else if (result.type === "village" || result.type === "hamlet") zoomLevel = 13
    } else if (result.class === "highway" || result.class === "amenity") {
      zoomLevel = 16
    }

    console.log("Final coordinates and zoom:", {
      lat: latitude,
      lng: longitude,
      zoom: zoomLevel,
    })

    // Call the pan function
    onSearchPanTo(latitude, longitude, zoomLevel)

    // Update UI
    setShowResults(false)
    setSearchTerm(result.display_name.split(",")[0])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    } else if (e.key === "Escape") {
      setShowResults(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (value.trim().length > 2) {
      timeoutRef.current = setTimeout(() => {
        handleSearch()
      }, 500)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      id="search-box"
      className="absolute left-1/2 top-[15px] z-[30] w-[calc(100%-40px)] max-w-[350px] -translate-x-1/2 transform"
    >
      <div className="relative h-12 rounded-md bg-white shadow-md">
        <Input
          id="search-input"
          placeholder="Joylashuvni qidiring... (masalan: USA, Toshkent, London)"
          className="h-full w-full rounded-md border-none pl-4 pr-10 text-sm font-medium text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true)
            }
          }}
        />
        <Search
          className={`absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer text-gray-500 hover:opacity-60 transition-opacity ${
            isLoading ? "animate-spin" : ""
          }`}
          onClick={handleSearch}
        />
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg border border-gray-200 z-50">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => handleResultClick(result)}
            >
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{result.display_name.split(",")[0]}</div>
                <div className="text-xs text-gray-500 truncate">
                  {result.display_name.split(",").slice(1, 3).join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />}
    </div>
  )
}