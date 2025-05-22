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
      // APPROACH 1: First try the Text Search API (New) for direct results
      // This is better for general queries like "coffee shops in portland"
      console.log("Trying Google Places Text Search API (New) for:", query)
      const textSearchUrl = `https://places.googleapis.com/v1/places:searchText`

      const textSearchResponse = await fetch(textSearchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleApiKey,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id,places.location,places.types",
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "en",
        }),
      })

      if (textSearchResponse.ok) {
        const textSearchData = await textSearchResponse.json()
        console.log("Text Search API (New) response:", textSearchData)

        if (textSearchData.places && textSearchData.places.length > 0) {
          console.log("Found places using Text Search API (New):", textSearchData.places.length)

          const places = textSearchData.places.slice(0, 5).map((place: any) => ({
            id: place.id,
            name: place.displayName?.text || "Unknown Place",
            address: place.formattedAddress || "",
            coordinates: {
              lat: place.location?.latitude || 0,
              lng: place.location?.longitude || 0,
            },
            type: getPlaceTypeFromNewApi(place.types || []),
            url: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
          }))

          return NextResponse.json({ places, source: "google-places-new" })
        } else {
          console.log("Text Search API (New) returned no results")
        }
      } else {
        const errorText = await textSearchResponse.text()
        console.error("Text Search API (New) request failed:", textSearchResponse.status, errorText)
      }

      // APPROACH 2: If the new API fails, try the Find Place API (New)
      if (query.length > 3) {
        console.log("Trying Find Place API (New) for:", query)
        const findPlaceUrl = `https://places.googleapis.com/v1/places:searchText`

        const findPlaceResponse = await fetch(findPlaceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleApiKey,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id,places.location,places.types",
          },
          body: JSON.stringify({
            textQuery: query,
            languageCode: "en",
            // Optimize for exact name matches
            exactMatchFields: ["displayName"],
          }),
        })

        if (findPlaceResponse.ok) {
          const findPlaceData = await findPlaceResponse.json()
          console.log("Find Place API (New) response:", findPlaceData)

          if (findPlaceData.places && findPlaceData.places.length > 0) {
            console.log("Found places using Find Place API (New):", findPlaceData.places.length)

            const places = findPlaceData.places.slice(0, 5).map((place: any) => ({
              id: place.id,
              name: place.displayName?.text || "Unknown Place",
              address: place.formattedAddress || "",
              coordinates: {
                lat: place.location?.latitude || 0,
                lng: place.location?.longitude || 0,
              },
              type: getPlaceTypeFromNewApi(place.types || []),
              url: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
            }))

            return NextResponse.json({ places, source: "google-places-new" })
          } else {
            console.log("Find Place API (New) returned no results")
          }
        } else {
          const errorText = await findPlaceResponse.text()
          console.error("Find Place API (New) request failed:", findPlaceResponse.status, errorText)
        }
      }

      // APPROACH 3: If the new APIs fail, try the Autocomplete API (New)
      console.log("Trying Places Autocomplete API (New) for:", query)
      const autocompleteUrl = `https://places.googleapis.com/v1/places:autocomplete`

      const autocompleteResponse = await fetch(autocompleteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleApiKey,
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "en",
          types: ["establishment", "geocode"],
        }),
      })

      if (autocompleteResponse.ok) {
        const autocompleteData = await autocompleteResponse.json()
        console.log("Autocomplete API (New) response:", autocompleteData)

        if (autocompleteData.suggestions && autocompleteData.suggestions.length > 0) {
          console.log("Found suggestions using Autocomplete API (New):", autocompleteData.suggestions.length)

          // Get place details for each suggestion
          const places = await Promise.all(
            autocompleteData.suggestions.slice(0, 5).map(async (suggestion: any) => {
              try {
                // Get place details using the place ID
                const detailsUrl = `https://places.googleapis.com/v1/places/${suggestion.placeId}`

                console.log("Fetching place details for:", suggestion.text?.text)

                const detailsResponse = await fetch(detailsUrl, {
                  method: "GET",
                  headers: {
                    "X-Goog-Api-Key": googleApiKey,
                    "X-Goog-FieldMask": "displayName,formattedAddress,id,location,types",
                  },
                })

                if (detailsResponse.ok) {
                  const place = await detailsResponse.json()
                  console.log("Details API (New) response for", suggestion.text?.text, ":", place)

                  return {
                    id: place.id,
                    name: place.displayName?.text || suggestion.text?.text || "Unknown Place",
                    address: place.formattedAddress || "",
                    coordinates: {
                      lat: place.location?.latitude || 0,
                      lng: place.location?.longitude || 0,
                    },
                    type: getPlaceTypeFromNewApi(place.types || []),
                    url: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
                  }
                } else {
                  const errorText = await detailsResponse.text()
                  console.error("Place details API (New) error:", detailsResponse.status, errorText)
                  return null
                }
              } catch (error) {
                console.error("Error getting place details:", error)
                return null
              }
            }),
          )

          const validPlaces = places.filter(Boolean) as Place[]
          console.log("Returning", validPlaces.length, "places from Google Places API (New)")

          if (validPlaces.length > 0) {
            return NextResponse.json({ places: validPlaces, source: "google-places-new" })
          }
        } else {
          console.log("Autocomplete API (New) returned no suggestions")
        }
      } else {
        const errorText = await autocompleteResponse.text()
        console.error("Autocomplete API (New) request failed:", autocompleteResponse.status, errorText)
      }

      // If all new API approaches fail, fall back to Nominatim
      console.log("All Google Places API (New) approaches failed, using fallback search")
      return await fallbackSearch(query)
    } catch (error) {
      console.error("Google Places API error:", error)
      return await fallbackSearch(query)
    }
  } catch (error) {
    console.error("Error in places autocomplete:", error)
    return NextResponse.json({ error: "Failed to fetch place suggestions" }, { status: 500 })
  }
}

// Fallback to Nominatim if Google Places API is not available
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

// Helper function to get a friendly place type from Google Places API (New) types
function getPlaceTypeFromNewApi(types: string[]): string {
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
  if (types.includes("tourist_attraction")) return "attraction"
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
