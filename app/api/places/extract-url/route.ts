import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

interface PlaceResult {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  type: string
  url: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("=== URL EXTRACTION DEBUG ===")
    console.log("Original URL:", url)

    // Check if it's a Google Maps URL
    if (url.includes("google.com/maps") || url.includes("goo.gl/maps") || url.includes("maps.app.goo.gl")) {
      return await extractGoogleMapsUrl(url)
    }

    // For other URLs, try to extract location data using meta tags
    return await extractGenericUrl(url)
  } catch (error) {
    console.error("Error extracting place from URL:", error)
    return NextResponse.json(
      { error: "Failed to extract place information from URL", details: (error as Error).message },
      { status: 500 },
    )
  }
}

async function extractGoogleMapsUrl(url: string): Promise<NextResponse> {
  try {
    console.log("Processing Google Maps URL:", url)

    // Handle short URLs by following redirects
    if (url.includes("goo.gl/maps") || url.includes("maps.app.goo.gl")) {
      try {
        console.log("Expanding short URL...")
        const response = await fetch(url, {
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })
        url = response.url
        console.log("Expanded URL:", url)
      } catch (error) {
        console.error("Error expanding short URL:", error)
        // Continue with the original URL if expansion fails
      }
    }

    // Extract coordinates from URL
    let lat: number | null = null
    let lng: number | null = null
    let name: string | null = null

    console.log("Trying to extract coordinates from URL...")

    // Try multiple regex patterns for different Google Maps URL formats
    const patterns = [
      { name: "@pattern", regex: /@(-?\d+\.\d+),(-?\d+\.\d+)/ },
      { name: "!3d pattern", regex: /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/ },
      { name: "ll pattern", regex: /ll=(-?\d+\.\d+),(-?\d+\.\d+)/ },
      { name: "center pattern", regex: /center=(-?\d+\.\d+),(-?\d+\.\d+)/ },
      { name: "q pattern", regex: /q=(-?\d+\.\d+),(-?\d+\.\d+)/ },
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern.regex)
      if (match) {
        console.log(`Found coordinates using ${pattern.name}:`, match[1], match[2])
        lat = Number.parseFloat(match[1])
        lng = Number.parseFloat(match[2])
        break
      }
    }

    console.log("Extracted coordinates:", { lat, lng })

    // Try to extract place name from URL
    console.log("Trying to extract place name from URL...")
    const placeNamePatterns = [
      { name: "place pattern", regex: /place\/([^/]+)/ },
      { name: "query pattern", regex: /query=([^&]+)/ },
      { name: "q pattern", regex: /q=([^&]+)/ },
      { name: "search pattern", regex: /search\/([^/]+)/ },
    ]

    for (const pattern of placeNamePatterns) {
      const match = url.match(pattern.regex)
      if (match) {
        console.log(`Found place name using ${pattern.name}:`, match[1])
        name = decodeURIComponent(match[1].replace(/\+/g, " "))
        // Remove coordinates from name if they exist
        name = name.replace(/^-?\d+\.\d+,-?\d+\.\d+/, "").trim()
        if (name) break
      }
    }

    console.log("Extracted place name:", name)

    // If we couldn't extract coordinates, try fetching the page
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.log("Coordinates not found in URL, trying to fetch page content...")
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })
        const html = await response.text()
        console.log("Fetched page content, length:", html.length)

        const $ = cheerio.load(html)

        // Try to extract from meta tags
        const metaDescription = $('meta[name="description"]').attr("content")
        console.log("Meta description:", metaDescription)

        if (metaDescription) {
          // Try to extract coordinates from meta description
          const metaMatch = metaDescription.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
          if (metaMatch) {
            console.log("Found coordinates in meta description:", metaMatch[1], metaMatch[2])
            lat = Number.parseFloat(metaMatch[1])
            lng = Number.parseFloat(metaMatch[2])
          }

          // Try to extract name from title or meta description
          if (!name) {
            const title = $("title").text().trim()
            console.log("Page title:", title)
            name = title.split(" - ")[0] || metaDescription.split(",")[0]
          }
        }

        // Look for coordinates in script tags
        const scripts = $("script").toArray()
        for (const script of scripts) {
          const scriptContent = $(script).html() || ""
          const coordMatch = scriptContent.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
          if (coordMatch && !lat && !lng) {
            console.log("Found coordinates in script:", coordMatch[1], coordMatch[2])
            lat = Number.parseFloat(coordMatch[1])
            lng = Number.parseFloat(coordMatch[2])
            break
          }
        }
      } catch (error) {
        console.error("Error fetching page content:", error)
      }
    }

    console.log("Final extracted data:", { lat, lng, name })

    // If we still don't have coordinates, return an error
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error("Could not extract coordinates from URL")
      return NextResponse.json(
        {
          error: "Could not extract location coordinates from URL",
          details:
            "The URL doesn't contain recognizable location data. Please try a different URL or add the place manually.",
          debug: { originalUrl: url, extractedLat: lat, extractedLng: lng },
        },
        { status: 400 },
      )
    }

    if (!name) {
      name = "Unknown Place"
    }

    // Use reverse geocoding to get address
    console.log("Getting address from coordinates...")
    const address = await getAddressFromCoordinates(lat, lng)

    const place: PlaceResult = {
      id: `gm-${Date.now()}`,
      name,
      address: address || "Unknown Address",
      coordinates: { lat, lng },
      type: "place",
      url,
    }

    console.log("Successfully extracted place:", place)
    return NextResponse.json({ place })
  } catch (error) {
    console.error("Error extracting from Google Maps URL:", error)
    return NextResponse.json(
      {
        error: "Failed to extract place information from Google Maps URL",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

async function extractGenericUrl(url: string): Promise<NextResponse> {
  try {
    console.log("Extracting from generic URL:", url)
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // Try to extract location data from meta tags
    let lat: number | null = null
    let lng: number | null = null
    let name: string | null = null
    let address: string | null = null

    // Check for Open Graph location meta tags
    lat = Number.parseFloat($('meta[property="place:location:latitude"]').attr("content") || "")
    lng = Number.parseFloat($('meta[property="place:location:longitude"]').attr("content") || "")

    // Check for other meta tags
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      lat = Number.parseFloat($('meta[name="geo.position"][content*=";"]').attr("content")?.split(";")[0] || "")
      lng = Number.parseFloat($('meta[name="geo.position"][content*=";"]').attr("content")?.split(";")[1] || "")
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      lat = Number.parseFloat($('meta[name="ICBM"]').attr("content")?.split(",")[0] || "")
      lng = Number.parseFloat($('meta[name="ICBM"]').attr("content")?.split(",")[1] || "")
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      lat = Number.parseFloat($('meta[property="og:latitude"]').attr("content") || "")
      lng = Number.parseFloat($('meta[property="og:longitude"]').attr("content") || "")
    }

    // Check for Schema.org location data
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      const jsonLdScripts = $('script[type="application/ld+json"]')
      let foundInJsonLd = false

      jsonLdScripts.each((_, element) => {
        if (foundInJsonLd) return
        try {
          const jsonContent = $(element).html()
          if (jsonContent) {
            const data = JSON.parse(jsonContent)

            // Handle array of objects
            const items = Array.isArray(data) ? data : [data]

            for (const item of items) {
              // Check for geo property
              if (item.geo && !foundInJsonLd) {
                lat = Number.parseFloat(item.geo.latitude || item.geo.lat)
                lng = Number.parseFloat(item.geo.longitude || item.geo.lng)
                if (!isNaN(lat) && !isNaN(lng)) {
                  foundInJsonLd = true
                  break
                }
              }

              // Check for location property
              if (item.location && item.location.geo && !foundInJsonLd) {
                lat = Number.parseFloat(item.location.geo.latitude || item.location.geo.lat)
                lng = Number.parseFloat(item.location.geo.longitude || item.location.geo.lng)
                if (!isNaN(lat) && !isNaN(lng)) {
                  foundInJsonLd = true
                  break
                }
              }

              // Check for address
              if (item.address && !address) {
                if (typeof item.address === "string") {
                  address = item.address
                } else if (item.address.streetAddress) {
                  address = [
                    item.address.streetAddress,
                    item.address.addressLocality,
                    item.address.addressRegion,
                    item.address.postalCode,
                    item.address.addressCountry,
                  ]
                    .filter(Boolean)
                    .join(", ")
                }
              }

              // Check for name
              if (item.name && !name) {
                name = item.name
              }
            }
          }
        } catch (e) {
          console.error("Error parsing JSON-LD:", e)
        }
      })
    }

    // Get name from title if not found
    if (!name) {
      name = $("title").text().trim() || $('meta[property="og:title"]').attr("content") || "Unknown Place"
    }

    // Try to extract coordinates from any text on the page as a last resort
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      const bodyText = $("body").text()
      const coordMatches = bodyText.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
      if (coordMatches) {
        lat = Number.parseFloat(coordMatches[1])
        lng = Number.parseFloat(coordMatches[2])
      }
    }

    // If we couldn't extract coordinates, return an error
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error("Could not extract coordinates from generic URL:", url)
      return NextResponse.json(
        {
          error: "Could not extract location coordinates from URL",
          details: "The website doesn't contain recognizable location data",
          fallbackOption: "manualEntry",
        },
        { status: 400 },
      )
    }

    // Use reverse geocoding to get address if not found
    if (!address) {
      address = await getAddressFromCoordinates(lat, lng)
    }

    const place: PlaceResult = {
      id: `url-${Date.now()}`,
      name,
      address: address || "Unknown Address",
      coordinates: { lat, lng },
      type: "place",
      url,
    }

    return NextResponse.json({ place })
  } catch (error) {
    console.error("Error extracting from generic URL:", error)
    return NextResponse.json(
      {
        error: "Failed to extract place information from URL",
        details: (error as Error).message,
        fallbackOption: "manualEntry",
      },
      { status: 500 },
    )
  }
}

async function getAddressFromCoordinates(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: {
        "User-Agent": "LO Place App (https://llllllo.com)",
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.display_name) {
      return data.display_name
    }

    return null
  } catch (error) {
    console.error("Error in reverse geocoding:", error)
    return null
  }
}
