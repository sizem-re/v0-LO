import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query") || "coffee shop"
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API key is not configured" }, { status: 500 })
  }

  try {
    // Test the Text Search API (New)
    console.log("Testing Google Places Text Search API (New)")
    const textSearchUrl = `https://places.googleapis.com/v1/places:searchText`

    const textSearchResponse = await fetch(textSearchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id,places.location",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "en",
        maxResultCount: 1,
      }),
    })

    const textSearchStatus = textSearchResponse.status
    let textSearchData = null

    try {
      textSearchData = await textSearchResponse.json()
    } catch (e) {
      textSearchData = { error: "Failed to parse JSON response" }
    }

    return NextResponse.json({
      query,
      apiKeyFirstFive: apiKey.substring(0, 5) + "...",
      textSearch: {
        status: textSearchStatus,
        statusText: textSearchResponse.statusText,
        data: textSearchData,
      },
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": "API_KEY_HIDDEN",
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id,places.location",
      },
      body: {
        textQuery: query,
        languageCode: "en",
        maxResultCount: 1,
      },
    })
  } catch (error) {
    console.error("Error in debug places endpoint:", error)
    return NextResponse.json(
      {
        error: "Failed to test Places API",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
