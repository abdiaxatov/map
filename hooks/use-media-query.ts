"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQueryList = window.matchMedia(query)
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)

    setMatches(mediaQueryList.matches) // Initial check
    mediaQueryList.addEventListener("change", listener)

    return () => {
      mediaQueryList.removeEventListener("change", listener)
    }
  }, [query])

  return matches
}
