import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || "The Method Skateboards and Coffee"

    console.log("=== DEBUG PLACES API ===")
    console.log("Query:", query)

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
    console.log("API Key exists:", !!googleApiKey)
    console.log("API Key length:", googleApiKey?.length || 0)

    if (!googleApiKey) {
      return NextResponse.json({ error: "No Google Places API key found" }, { status: 500 })
    }

    // Test Find Place API
    console.log("Testing Find Place API...")
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      query,
    )}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`

    console.log("Find Place URL:", findPlaceUrl)

    const findPlaceResponse = await fetch(findPlaceUrl)
    console.log("Find Place Response Status:", findPlaceResponse.status)

    const findPlaceData = await findPlaceResponse.json()
    console.log("Find Place Response:", JSON.stringify(findPlaceData, null, 2))

    // Test Autocomplete API
    console.log("Testing Autocomplete API...")
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query,
    )}&key=${googleApiKey}&types=establishment|geocode`

    console.log("Autocomplete URL:", autocompleteUrl)

    const autocompleteResponse = await fetch(autocompleteUrl)
    console.log("Autocomplete Response Status:", autocompleteResponse.status)

    const autocompleteData = await autocompleteResponse.json()
    console.log("Autocomplete Response:", JSON.stringify(autocompleteData, null, 2))

    return NextResponse.json({
      query,
      apiKeyExists: !!googleApiKey,
      findPlace: {
        status: findPlaceResponse.status,
        data: findPlaceData,
      },
      autocomplete: {
        status: autocompleteResponse.status,
        data: autocompleteData,
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
