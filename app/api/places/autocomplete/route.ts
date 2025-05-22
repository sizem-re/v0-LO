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
        console.log("Using Google Maps Platform API with key:", googleApiKey.substring(0, 5) + "...")

        // Use the Maps JavaScript API Places Autocomplete
        const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`

        console.log("Fetching from Google Places API:", placesUrl.replace(googleApiKey, "API_KEY"))

        const placesResponse = await fetch(placesUrl)

        if (placesResponse.ok) {
          const data = await placesResponse.json()
          console.log("Google Places API response status:", data.status)

          if (data.status === "OK" && data.results && data.results.length > 0) {
            places = data.results.slice(0, limit).map((place: any) => ({
              id: place.place_id,
              name: place.name || "Unknown Place",
              address: place.formatted_address || "",
              lat: place.geometry?.location?.lat || 0,
              lng: place.geometry?.location?.lng || 0,
              type: "google_places",
              source: "google_places",
            }))

            apiSource = "google_places"
            console.log(`Found ${places.length} places using Google Places API`)
          } else {
            console.log("No results from Google Places API or error:", data.status, data.error_message)

            // Try Place Autocomplete API as fallback
            const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${googleApiKey}`

            console.log("Trying Google Places Autocomplete API")

            const autocompleteResponse = await fetch(autocompleteUrl)

            if (autocompleteResponse.ok) {
              const autocompleteData = await autocompleteResponse.json()
              console.log("Google Places Autocomplete API response status:", autocompleteData.status)

              if (
                autocompleteData.status === "OK" &&
                autocompleteData.predictions &&
                autocompleteData.predictions.length > 0
              ) {
                // For each prediction, we need to get the place details
                const detailsPromises = autocompleteData.predictions.slice(0, limit).map(async (prediction: any) => {
                  const placeId = prediction.place_id

                  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry&key=${googleApiKey}`

                  const detailsResponse = await fetch(detailsUrl)

                  if (detailsResponse.ok) {
                    const detailsData = await detailsResponse.json()

                    if (detailsData.status === "OK" && detailsData.result) {
                      return {
                        id: placeId,
                        name: detailsData.result.name || prediction.structured_formatting?.main_text || "Unknown Place",
                        address: detailsData.result.formatted_address || prediction.description || "",
                        lat: detailsData.result.geometry?.location?.lat || 0,
                        lng: detailsData.result.geometry?.location?.lng || 0,
                        type: "google_autocomplete",
                        source: "google_autocomplete",
                      }
                    }
                  }

                  return null
                })

                const detailsResults = await Promise.all(detailsPromises)
                places = detailsResults.filter(Boolean) as Place[]
                apiSource = "google_autocomplete"
                console.log(`Found ${places.length} places using Google Places Autocomplete + Details API`)
              }
            }
          }
        } else {
          const errorText = await placesResponse.text()
          console.error("Google Places API request failed:", placesResponse.status, errorText)
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

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error searching for places:", error)
    return NextResponse.json(
      { error: "Failed to search for places", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
