import { type NextRequest, NextResponse } from "next/server"

interface PlaceCoordinates {
  lat: number
  lng: number
}

interface Place {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
  type?: string
  source?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")
  const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  console.log(`Searching for places: ${query}`)

  try {
    // Get Google Places API key from environment variables
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

    let places: Place[] = []
    let apiSource = "nominatim" // Default source

    // Try Google Places API if API key is available
    if (googleApiKey) {
      try {
        // 1. First try the Text Search API (best for complete queries)
        console.log("Trying Google Places Text Search API...")
        const textSearchUrl = "https://places.googleapis.com/v1/places:searchText"

        const textSearchResponse = await fetch(textSearchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleApiKey,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.id",
          },
          body: JSON.stringify({
            textQuery: query,
            maxResultCount: limit,
          }),
        })

        if (textSearchResponse.ok) {
          const data = await textSearchResponse.json()
          console.log("Text Search API response:", data)

          if (data.places && data.places.length > 0) {
            places = data.places.map((place: any) => ({
              id: place.id,
              name: place.displayName?.text || "Unknown Place",
              address: place.formattedAddress || "",
              lat: place.location?.latitude || 0,
              lng: place.location?.longitude || 0,
              type: "google_text_search",
            }))
            apiSource = "google_text_search"
            console.log(`Found ${places.length} places using Text Search API`)
          } else {
            console.log("No results from Text Search API, trying Find Place API...")

            // 2. Try Find Place API (better for business names)
            const findPlaceUrl = "https://places.googleapis.com/v1/places:findPlace"

            const findPlaceResponse = await fetch(findPlaceUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": googleApiKey,
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.id",
              },
              body: JSON.stringify({
                textQuery: query,
                languageCode: "en",
              }),
            })

            if (findPlaceResponse.ok) {
              const findPlaceData = await findPlaceResponse.json()
              console.log("Find Place API response:", findPlaceData)

              if (findPlaceData.places && findPlaceData.places.length > 0) {
                places = findPlaceData.places.map((place: any) => ({
                  id: place.id,
                  name: place.displayName?.text || "Unknown Place",
                  address: place.formattedAddress || "",
                  lat: place.location?.latitude || 0,
                  lng: place.location?.longitude || 0,
                  type: "google_find_place",
                }))
                apiSource = "google_find_place"
                console.log(`Found ${places.length} places using Find Place API`)
              } else {
                console.log("No results from Find Place API, trying Autocomplete API...")

                // 3. Try Autocomplete API (better for partial queries)
                const autocompleteUrl = "https://places.googleapis.com/v1/places:autocomplete"

                const autocompleteResponse = await fetch(autocompleteUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": googleApiKey,
                    "X-Goog-FieldMask": "predictions.placeId,predictions.description,predictions.primaryText",
                  },
                  body: JSON.stringify({
                    textQuery: query,
                    languageCode: "en",
                    maxResultCount: limit,
                  }),
                })

                if (autocompleteResponse.ok) {
                  const autocompleteData = await autocompleteResponse.json()
                  console.log("Autocomplete API response:", autocompleteData)

                  if (autocompleteData.predictions && autocompleteData.predictions.length > 0) {
                    // For each prediction, we need to get the place details
                    const detailsPromises = autocompleteData.predictions.map(async (prediction: any) => {
                      const placeId = prediction.placeId

                      const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`

                      const detailsResponse = await fetch(detailsUrl, {
                        method: "GET",
                        headers: {
                          "X-Goog-Api-Key": googleApiKey,
                          "X-Goog-FieldMask": "displayName,formattedAddress,location,id",
                        },
                      })

                      if (detailsResponse.ok) {
                        const details = await detailsResponse.json()
                        return {
                          id: details.id,
                          name: details.displayName?.text || prediction.primaryText?.text || "Unknown Place",
                          address: details.formattedAddress || prediction.description || "",
                          lat: details.location?.latitude || 0,
                          lng: details.location?.longitude || 0,
                          type: "google_autocomplete",
                        }
                      }

                      return null
                    })

                    const detailsResults = await Promise.all(detailsPromises)
                    places = detailsResults.filter(Boolean) as Place[]
                    apiSource = "google_autocomplete"
                    console.log(`Found ${places.length} places using Autocomplete + Details API`)
                  }
                }
              }
            }
          }
        }
      } catch (googleError) {
        console.error("Error using Google Places API:", googleError)
        console.log("Falling back to Nominatim...")
      }
    }

    // If Google Places API failed or returned no results, fall back to Nominatim
    if (places.length === 0) {
      console.log("Using Nominatim fallback for query:", query)

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}&limit=${limit}`

      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          "Accept-Language": "en-US,en",
          "User-Agent": "LO Place App (https://llllllo.com)",
        },
      })

      if (nominatimResponse.ok) {
        const data = await nominatimResponse.json()

        places = data.map((place: any) => ({
          id: place.place_id.toString(),
          name: place.display_name.split(",")[0] || place.display_name,
          address: place.display_name,
          lat: Number.parseFloat(place.lat),
          lng: Number.parseFloat(place.lon),
          type: "nominatim",
          source: "nominatim",
        }))

        apiSource = "nominatim"
        console.log(`Found ${places.length} places using Nominatim`)
      }
    }

    // Add source information to the response
    const response = {
      places,
      source: apiSource,
      query,
    }

    console.log("Search response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error searching for places:", error)
    return NextResponse.json(
      { error: "Failed to search for places", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
