import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    const testUrl = url || "https://g.co/kgs/vXed47C"

    console.log("=== DEBUG URL EXTRACTION ===")
    console.log("Test URL:", testUrl)

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
    console.log("API Key exists:", !!googleApiKey)

    // Step 1: Follow the redirect
    console.log("Step 1: Following redirect...")
    const response = await fetch(testUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const finalUrl = response.url
    console.log("Final URL:", finalUrl)
    console.log("Response Status:", response.status)

    // Step 2: Get the HTML content
    console.log("Step 2: Getting HTML content...")
    const html = await response.text()
    console.log("HTML length:", html.length)

    // Step 3: Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ""
    console.log("Extracted title:", title)

    // Step 4: Try to find business name in title
    const businessName = title.split(" - ")[0].trim()
    console.log("Business name:", businessName)

    // Step 5: Test Google Places API with business name
    if (googleApiKey && businessName) {
      console.log("Step 5: Testing Google Places API...")
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        businessName,
      )}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`

      console.log("Search URL:", searchUrl)

      const searchResponse = await fetch(searchUrl)
      console.log("Search Response Status:", searchResponse.status)

      const searchData = await searchResponse.json()
      console.log("Search Response:", JSON.stringify(searchData, null, 2))

      return NextResponse.json({
        testUrl,
        finalUrl,
        responseStatus: response.status,
        htmlLength: html.length,
        title,
        businessName,
        apiKeyExists: !!googleApiKey,
        searchResult: {
          status: searchResponse.status,
          data: searchData,
        },
      })
    }

    return NextResponse.json({
      testUrl,
      finalUrl,
      responseStatus: response.status,
      htmlLength: html.length,
      title,
      businessName,
      apiKeyExists: !!googleApiKey,
      error: "No API key or business name",
    })
  } catch (error) {
    console.error("Debug URL error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 },
    )
  }
}
