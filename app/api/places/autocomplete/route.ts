import { type NextRequest, NextResponse } from "next/server"

interface PlaceCoordinates {
  lat: number
  lng: number
}

interface Place {
  id: string
  name: string
  address: string
  coordinates: PlaceCoordinates
  type: string
  url?: string
}

// Modify the GET function to include more detailed logging
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    console.log("Autocomplete search for:", query)

    // Check if we have a Google Places API key
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!googleApiKey) {
      console.warn("Google Places API key not found, using fallback search")
      return await fallbackSearch(query)
    }

    try {
      // First, try the Text Search API for direct results
      // This is better for general queries like "coffee shops in portland"
      console.log("Trying Google Places Text Search API for:", query)
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query,
      )}&key=${googleApiKey}`

      const textSearchResponse = await fetch(textSearchUrl)
      const textSearchData = await textSearchResponse.json()

      console.log("Text Search API response status:", textSearchData.status)

      if (textSearchResponse.ok) {
        if (textSearchData.status === "OK" && textSearchData.results && textSearchData.results.length > 0) {
          console.log("Found places using Text Search API:", textSearchData.results.length)

          const places = textSearchData.results.slice(0, 5).map((place: any) => ({
            id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            type: getPlaceType(place.types || []),
            url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          }))

          return NextResponse.json({ places })
        } else {
          console.log(
            "Text Search API returned no results or error:",
            textSearchData.status,
            textSearchData.error_message,
          )
        }
      } else {
        console.error("Text Search API request failed:", textSearchResponse.statusText)
      }

      // If Text Search didn't work well, try Find Place API for business names
      if (query.length > 3 && !query.match(/^\d+/)) {
        console.log("Trying Find Place API for business name:", query)
        const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
          query,
        )}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`

        const findPlaceResponse = await fetch(findPlaceUrl)
        const findPlaceData = await findPlaceResponse.json()

        console.log("Find Place API response status:", findPlaceData.status)

        if (findPlaceResponse.ok) {
          if (findPlaceData.status === "OK" && findPlaceData.candidates && findPlaceData.candidates.length > 0) {
            console.log("Found places using Find Place API:", findPlaceData.candidates.length)

            const places = findPlaceData.candidates.map((place: any) => ({
              id: place.place_id,
              name: place.name,
              address: place.formatted_address,
              coordinates: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
              },
              type: getPlaceType(place.types || []),
              url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            }))

            return NextResponse.json({ places })
          } else {
            console.log(
              "Find Place API returned no results or error:",
              findPlaceData.status,
              findPlaceData.error_message,
            )
          }
        } else {
          console.error("Find Place API request failed:", findPlaceResponse.statusText)
        }
      }

      // Finally, fall back to Autocomplete + Details API
      // This is good for partial queries and address completion
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query,
      )}&key=${googleApiKey}&types=establishment|geocode`

      console.log("Trying Google Places Autocomplete API for:", query)

      const autocompleteResponse = await fetch(autocompleteUrl)
      const autocompleteData = await autocompleteResponse.json()

      console.log("Autocomplete API response status:", autocompleteData.status)

      if (!autocompleteResponse.ok) {
        console.error("Google Places Autocomplete API error:", autocompleteResponse.statusText)
        return await fallbackSearch(query)
      }

      if (autocompleteData.status !== "OK") {
        console.error("Google Places Autocomplete API error:", autocompleteData.status, autocompleteData.error_message)
        return await fallbackSearch(query)
      }

      if (!autocompleteData.predictions || autocompleteData.predictions.length === 0) {
        console.log("No predictions found from Autocomplete API, using fallback search")
        return await fallbackSearch(query)
      }

      console.log("Found predictions using Autocomplete API:", autocompleteData.predictions.length)

      // Step 2: Get place details for each prediction
      const places = await Promise.all(
        autocompleteData.predictions.slice(0, 5).map(async (prediction: any) => {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${
              prediction.place_id
            }&fields=name,formatted_address,geometry,types,url&key=${googleApiKey}`

            console.log("Fetching place details for:", prediction.description)

            const detailsResponse = await fetch(detailsUrl)
            const detailsData = await detailsResponse.json()

            console.log("Details API response status for", prediction.description, ":", detailsData.status)

            if (!detailsResponse.ok) {
              console.error("Place details API error:", detailsResponse.statusText)
              return null
            }

            if (detailsData.status !== "OK") {
              console.error("Place details API error:", detailsData.status, detailsData.error_message)
              return null
            }

            const place = detailsData.result

            return {
              id: place.place_id,
              name: place.name || prediction.description.split(",")[0],
              address: place.formatted_address || prediction.description,
              coordinates: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
              },
              type: getPlaceType(place.types || []),
              url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            }
          } catch (error) {
            console.error("Error getting place details:", error)
            return null
          }
        }),
      )

      const validPlaces = places.filter(Boolean) as Place[]

      console.log("Returning", validPlaces.length, "places from Google API")

      if (validPlaces.length === 0) {
        console.log("No valid places found from Google APIs, using fallback search")
        return await fallbackSearch(query)
      }

      return NextResponse.json({ places: validPlaces })
    } catch (error) {
      console.error("Google Places API error:", error)
      return await fallbackSearch(query)
    }
  } catch (error) {
    console.error("Error in places autocomplete:", error)
    return NextResponse.json({ error: "Failed to fetch place suggestions" }, { status: 500 })
  }
}

// Modify the fallback search function to include more detailed logging
async function fallbackSearch(query: string): Promise<NextResponse> {
  try {
    console.log("Using Nominatim fallback for:", query)

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

    console.log("Nominatim returned", data.length, "results")

    const places: Place[] = data.map((item: any) => ({
      id: item.place_id.toString(),
      name: item.display_name.split(",")[0],
      address: item.display_name,
      coordinates: {
        lat: Number.parseFloat(item.lat),
        lng: Number.parseFloat(item.lon),
      },
      type: getOsmType(item.class, item.type),
      url: `https://www.openstreetmap.org/${item.osm_type}/${item.osm_id}`,
    }))

    return NextResponse.json({ places, source: "nominatim" })
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
