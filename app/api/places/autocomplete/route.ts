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
      console.error("Google Places API key is not configured")
      return NextResponse.json({ error: "Google Places API key is not configured" }, { status: 500 })
    }

    console.log("Using Google Places API (New) with key:", googleApiKey.substring(0, 5) + "...")

    // APPROACH 1: First try the Text Search API (New)
    try {
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

      console.log("Text Search API (New) status:", textSearchResponse.status)

      if (!textSearchResponse.ok) {
        const errorText = await textSearchResponse.text()
        console.error("Text Search API (New) request failed:", textSearchResponse.status, errorText)
        throw new Error(`Text Search API (New) request failed: ${errorText}`)
      }

      const textSearchData = await textSearchResponse.json()
      console.log("Text Search API (New) response:", JSON.stringify(textSearchData).substring(0, 200) + "...")

      if (textSearchData.places && textSearchData.places.length > 0) {
        const places = textSearchData.places.map((place: any) => ({
          id: place.id,
          name: place.displayName?.text || "Unknown Place",
          address: place.formattedAddress || "",
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
          type: "google_text_search_new",
          source: "google_text_search_new",
        }))

        console.log(`Found ${places.length} places using Text Search API (New)`)

        // Return results from Text Search API
        return NextResponse.json({
          places,
          source: "google_text_search_new",
          query,
        })
      } else {
        console.log("Text Search API (New) returned no results")
      }
    } catch (textSearchError) {
      console.error("Error with Text Search API (New):", textSearchError)
      // Continue to next approach
    }

    // APPROACH 2: If Text Search fails, try Find Place API (New)
    try {
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

      console.log("Find Place API (New) status:", findPlaceResponse.status)

      if (!findPlaceResponse.ok) {
        const errorText = await findPlaceResponse.text()
        console.error("Find Place API (New) request failed:", findPlaceResponse.status, errorText)
        throw new Error(`Find Place API (New) request failed: ${errorText}`)
      }

      const findPlaceData = await findPlaceResponse.json()
      console.log("Find Place API (New) response:", JSON.stringify(findPlaceData).substring(0, 200) + "...")

      if (findPlaceData.places && findPlaceData.places.length > 0) {
        const places = findPlaceData.places.map((place: any) => ({
          id: place.id,
          name: place.displayName?.text || "Unknown Place",
          address: place.formattedAddress || "",
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
          type: "google_find_place_new",
          source: "google_find_place_new",
        }))

        console.log(`Found ${places.length} places using Find Place API (New)`)

        // Return results from Find Place API
        return NextResponse.json({
          places,
          source: "google_find_place_new",
          query,
        })
      } else {
        console.log("Find Place API (New) returned no results")
      }
    } catch (findPlaceError) {
      console.error("Error with Find Place API (New):", findPlaceError)
      // Continue to next approach
    }

    // APPROACH 3: If both previous approaches fail, try Autocomplete API (New)
    try {
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

      console.log("Autocomplete API (New) status:", autocompleteResponse.status)

      if (!autocompleteResponse.ok) {
        const errorText = await autocompleteResponse.text()
        console.error("Autocomplete API (New) request failed:", autocompleteResponse.status, errorText)
        throw new Error(`Autocomplete API (New) request failed: ${errorText}`)
      }

      const autocompleteData = await autocompleteResponse.json()
      console.log("Autocomplete API (New) response:", JSON.stringify(autocompleteData).substring(0, 200) + "...")

      if (autocompleteData.predictions && autocompleteData.predictions.length > 0) {
        // For each prediction, we need to get the place details
        const detailsPromises = autocompleteData.predictions.slice(0, limit).map(async (prediction: any) => {
          try {
            const placeId = prediction.placeId

            const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`

            const detailsResponse = await fetch(detailsUrl, {
              method: "GET",
              headers: {
                "X-Goog-Api-Key": googleApiKey,
                "X-Goog-FieldMask": "displayName,formattedAddress,location,id",
              },
            })

            if (!detailsResponse.ok) {
              console.error(`Details API (New) request failed for ${placeId}:`, detailsResponse.status)
              return null
            }

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
          } catch (detailsError) {
            console.error("Error getting place details:", detailsError)
            return null
          }
        })

        const detailsResults = await Promise.all(detailsPromises)
        const places = detailsResults.filter(Boolean) as Place[]

        console.log(`Found ${places.length} places using Autocomplete + Details API (New)`)

        if (places.length > 0) {
          // Return results from Autocomplete + Details API
          return NextResponse.json({
            places,
            source: "google_autocomplete_new",
            query,
          })
        }
      } else {
        console.log("Autocomplete API (New) returned no predictions")
      }
    } catch (autocompleteError) {
      console.error("Error with Autocomplete API (New):", autocompleteError)
    }

    // If all approaches returned no results or failed
    console.log("All Google Places API (New) approaches failed or returned no results")

    // Return empty results instead of an error
    return NextResponse.json({
      places: [],
      source: null,
      query,
      message: "No places found for this query",
    })
  } catch (error) {
    console.error("Error searching for places:", error)

    // Return a more detailed error response
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
