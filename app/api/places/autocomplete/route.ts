import { type NextRequest, NextResponse } from "next/server"

// Define the place object structure
interface PlaceResult {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: string
  url?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    // Check if we have a Google Places API key
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!googleApiKey) {
      console.warn("Google Places API key not found, using fallback search")
      return await fallbackSearch(query)
    }

    // Use Google Places Autocomplete API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${googleApiKey}&types=establishment|geocode`,
    )

    if (!response.ok) {
      console.error("Google Places API error:", response.statusText)
      return await fallbackSearch(query)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      console.error("Google Places API error:", data.status, data.error_message)
      return await fallbackSearch(query)
    }

    // Get place details for each prediction
    const placePromises = data.predictions.slice(0, 5).map(async (prediction: any) => {
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=name,formatted_address,geometry,types,url&key=${googleApiKey}`,
      )

      if (!detailsResponse.ok) {
        return null
      }

      const detailsData = await detailsResponse.json()

      if (detailsData.status !== "OK") {
        return null
      }

      const place = detailsData.result

      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        type: getPlaceType(place.types),
        url: place.url,
      }
    })

    const places = (await Promise.all(placePromises)).filter(Boolean) as PlaceResult[]

    return NextResponse.json({ places })
  } catch (error) {
    console.error("Error in places autocomplete:", error)
    return NextResponse.json({ error: "Failed to fetch place suggestions" }, { status: 500 })
  }
}

// Fallback to Nominatim if Google Places API is not available
async function fallbackSearch(query: string): Promise<NextResponse> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
      {
        headers: {
          "User-Agent": "LO Place App (https://llllllo.com)",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`)
    }

    const data = await response.json()

    const places: PlaceResult[] = data.map((item: any) => ({
      id: item.place_id.toString(),
      name: item.display_name.split(",")[0],
      address: item.display_name,
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      type: getOsmType(item.class, item.type),
      url: `https://www.openstreetmap.org/${item.osm_type}/${item.osm_id}`,
    }))

    return NextResponse.json({ places })
  } catch (error) {
    console.error("Error in Nominatim fallback search:", error)
    return NextResponse.json({ error: "Failed to fetch place suggestions" }, { status: 500 })
  }
}

// Helper function to get a friendly place type from Google Places types
function getPlaceType(types: string[]): string {
  if (types.includes("restaurant")) return "restaurant"
  if (types.includes("cafe")) return "cafe"
  if (types.includes("bar")) return "bar"
  if (types.includes("lodging")) return "hotel"
  if (types.includes("park")) return "park"
  if (types.includes("museum")) return "museum"
  if (types.includes("store") || types.includes("shop")) return "shop"
  if (types.includes("airport")) return "airport"
  if (types.includes("train_station")) return "station"
  if (types.includes("bus_station")) return "station"
  if (types.includes("subway_station")) return "station"
  if (types.includes("point_of_interest")) return "attraction"
  if (types.includes("establishment")) return "business"
  if (types.includes("locality") || types.includes("administrative_area_level_1")) return "city"
  return "place"
}

// Helper function to get a friendly place type from OSM types
function getOsmType(osmClass: string, osmType: string): string {
  if (osmClass === "amenity") {
    if (["restaurant", "cafe", "fast_food"].includes(osmType)) return "restaurant"
    if (["bar", "pub"].includes(osmType)) return "bar"
    if (["hotel", "hostel", "guest_house"].includes(osmType)) return "hotel"
    if (["park", "garden"].includes(osmType)) return "park"
    if (["museum", "gallery", "arts_centre"].includes(osmType)) return "museum"
    if (["marketplace", "shop"].includes(osmType)) return "shop"
  }
  if (osmClass === "aeroway" && osmType === "aerodrome") return "airport"
  if (osmClass === "railway" && ["station", "halt"].includes(osmType)) return "station"
  if (osmClass === "highway" && osmType === "bus_stop") return "station"
  if (osmClass === "tourism") return "attraction"
  if (osmClass === "shop") return "shop"
  if (osmClass === "place") {
    if (["city", "town", "village"].includes(osmType)) return "city"
  }
  return "place"
}
