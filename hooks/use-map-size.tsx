"use client"

import { useState, useEffect } from "react"

export function useMapSize() {
  const [mapSize, setMapSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      setMapSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return mapSize
}

/**
 * Hook to determine optimal map container strategy based on screen size
 */
export function useMapStrategy() {
  const [strategy, setStrategy] = useState<'mobile' | 'desktop' | 'auto'>('auto')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const checkStrategy = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const aspectRatio = width / height
      const mobile = width < 768

      setIsMobile(mobile)
      
      // Determine strategy based on screen characteristics
      if (mobile) {
        setStrategy('mobile')
      } else if (aspectRatio > 1.5) {
        setStrategy('desktop')
      } else {
        setStrategy('auto')
      }
    }

    checkStrategy()
    window.addEventListener("resize", checkStrategy)

    return () => {
      window.removeEventListener("resize", checkStrategy)
    }
  }, [])

  return { strategy, isMobile }
}
