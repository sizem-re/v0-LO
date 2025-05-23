import type { Place } from "@/types/place"

export interface DatabasePlace {
  id: string
  name: string
  address?: string
  lat: string | number
  lng: string | number
  type?: string
  description?: string
  website_url?: string
  created_at: string
  updated_at: string
}

/**
 * Transform database places to match the expected Place interface
 */
export function transformDatabasePlaces(data: DatabasePlace[]): Place[] {
  return data
    .map((dbPlace): Place | null => {
      const lat = Number(dbPlace.lat)
      const lng = Number(dbPlace.lng)

      // Skip places with invalid coordinates
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Skipping place ${dbPlace.name} with invalid coordinates:`, { 
          lat: dbPlace.lat, 
          lng: dbPlace.lng 
        })
        return null
      }

      return {
        id: dbPlace.id,
        name: dbPlace.name,
        type: dbPlace.type,
        address: dbPlace.address || "",
        coordinates: {
          lat,
          lng,
        },
        description: dbPlace.description || "",
        website: dbPlace.website_url || "",
      }
    })
    .filter((place): place is Place => place !== null)
}

/**
 * Fetch places from the API and transform them
 */
export async function fetchPlaces(options: { limit?: number } = {}): Promise<Place[]> {
  const { limit } = options
  let url = "/api/places"
  
  if (limit) {
    url += `?limit=${limit}`
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch places: ${response.status}`)
  }

  const data: DatabasePlace[] = await response.json()
  return transformDatabasePlaces(data)
} 