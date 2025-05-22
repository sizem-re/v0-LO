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
    let apiSource = "google_places_new" // Default source

    console.log("Using Google Places API (New) with key:", googleApiKey.substring(0, 5) + "...")

    // APPROACH 1: First try the Text Search API (New)
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
        maxResultCount: limit,
      }),
    })

    if (!textSearchResponse.ok) {
      const errorText = await textSearchResponse.text()
      console.error("Text Search API (New) request failed:", textSearchResponse.status, errorText)

      // Try the next approach
      console.log("Text Search API (New) failed, trying Find Place API (New)")
    } else {
      const textSearchData = await textSearchResponse.json()
      console.log("Text Search API (New) response:", textSearchData)

      if (textSearchData.places && textSearchData.places.length > 0) {
        places = textSearchData.places.map((place: any) => ({
          id: place.id,
          name: place.displayName?.text || "Unknown Place",
          address: place.formattedAddress || "",
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
          type: "google_text_search_new",
          source: "google_text_search_new",
        }))

        apiSource = "google_text_search_new"
        console.log(`Found ${places.length} places using Text Search API (New)`)

        // Return results from Text Search API
        return NextResponse.json({
          places,
          source: apiSource,
          query,
        })
      } else {
        console.log("Text Search API (New) returned no results, trying Find Place API (New)")
      }
    }

    // APPROACH 2: If Text Search fails, try Find Place API (New)
    console.log("Trying Find Place API (New) for:", query)
    const findPlaceUrl = `https://places.googleapis.com/v1/places:findPlace`

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
      }),
    })

    if (!findPlaceResponse.ok) {
      const errorText = await findPlaceResponse.text()
      console.error("Find Place API (New) request failed:", findPlaceResponse.status, errorText)

      // Try the next approach
      console.log("Find Place API (New) failed, trying Autocomplete API (New)")
    } else {
      const findPlaceData = await findPlaceResponse.json()
      console.log("Find Place API (New) response:", findPlaceData)

      if (findPlaceData.places && findPlaceData.places.length > 0) {
        places = findPlaceData.places.map((place: any) => ({
          id: place.id,
          name: place.displayName?.text || "Unknown Place",
          address: place.formattedAddress || "",
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
          type: "google_find_place_new",
          source: "google_find_place_new",
        }))

        apiSource = "google_find_place_new"
        console.log(`Found ${places.length} places using Find Place API (New)`)

        // Return results from Find Place API
        return NextResponse.json({
          places,
          source: apiSource,
          query,
        })
      } else {
        console.log("Find Place API (New) returned no results, trying Autocomplete API (New)")
      }
    }

    // APPROACH 3: If both previous approaches fail, try Autocomplete API (New)
    console.log("Trying Places Autocomplete API (New) for:", query)
    const autocompleteUrl = `https://places.googleapis.com/v1/places:autocomplete`

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

    if (!autocompleteResponse.ok) {
      const errorText = await autocompleteResponse.text()
      console.error("Autocomplete API (New) request failed:", autocompleteResponse.status, errorText)

      // All approaches failed
      return NextResponse.json(
        {
          error: "All Google Places API (New) approaches failed",
          details: errorText,
          places: [],
          source: null,
          query,
        },
        { status: 500 },
      )
    }

    const autocompleteData = await autocompleteResponse.json()
    console.log("Autocomplete API (New) response:", autocompleteData)

    if (autocompleteData.predictions && autocompleteData.predictions.length > 0) {
      // For each prediction, we need to get the place details
      const detailsPromises = autocompleteData.predictions.slice(0, limit).map(async (prediction: any) => {
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
            type: "google_autocomplete_new",
            source: "google_autocomplete_new",
          }
        }

        return null
      })

      const detailsResults = await Promise.all(detailsPromises)
      places = detailsResults.filter(Boolean) as Place[]
      apiSource = "google_autocomplete_new"
      console.log(`Found ${places.length} places using Autocomplete + Details API (New)`)

      if (places.length > 0) {
        // Return results from Autocomplete + Details API
        return NextResponse.json({
          places,
          source: apiSource,
          query,
        })
      }
    }

    // If all approaches returned no results
    return NextResponse.json({
      places: [],
      source: null,
      query,
      message: "No places found for this query",
    })
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
