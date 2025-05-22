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

    if (!googleApiKey) {
      return NextResponse.json({ error: "Google Places API key is not configured" }, { status: 500 })
    }

    let places: Place[] = []
    let apiSource = "google_places" // Default source

    console.log("Using Google Maps Platform API with key:", googleApiKey.substring(0, 5) + "...")

    // Use the Maps JavaScript API Places Text Search
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`

    console.log("Fetching from Google Places API:", placesUrl.replace(googleApiKey, "API_KEY"))

    const placesResponse = await fetch(placesUrl)

    if (!placesResponse.ok) {
      const errorText = await placesResponse.text()
      console.error("Google Places API request failed:", placesResponse.status, errorText)
      return NextResponse.json(
        { error: "Google Places API request failed", details: errorText },
        { status: placesResponse.status },
      )
    }

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
    } else if (data.status !== "OK") {
      console.log("Google Places API error:", data.status, data.error_message)

      // Try Place Autocomplete API as fallback
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${googleApiKey}`

      console.log("Trying Google Places Autocomplete API")

      const autocompleteResponse = await fetch(autocompleteUrl)

      if (!autocompleteResponse.ok) {
        const errorText = await autocompleteResponse.text()
        console.error("Google Places Autocomplete API request failed:", autocompleteResponse.status, errorText)
        return NextResponse.json(
          { error: "Google Places API requests failed", details: errorText },
          { status: autocompleteResponse.status },
        )
      }

      const autocompleteData = await autocompleteResponse.json()
      console.log("Google Places Autocomplete API response status:", autocompleteData.status)

      if (autocompleteData.status === "OK" && autocompleteData.predictions && autocompleteData.predictions.length > 0) {
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
      } else {
        // If both APIs failed or returned no results
        return NextResponse.json({
          error: "No places found",
          status: data.status,
          message: data.error_message || autocompleteData.error_message || "No results from Google Places API",
          places: [],
          source: null,
          query,
        })
      }
    } else {
      // If the API returned OK but no results
      return NextResponse.json({
        places: [],
        source: apiSource,
        query,
        message: "No places found for this query",
      })
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
      {
        error: "Failed to search for places",
        details: error instanceof Error ? error.message : String(error),
        places: [],
        source: null,
        query,
      },
      { status: 500 },
    )
  }
}
