import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

interface PlaceResult {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: string
  url: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Check if it's a Google Maps URL
    if (url.includes("google.com/maps") || url.includes("goo.gl/maps")) {
      return await extractGoogleMapsUrl(url)
    }

    // For other URLs, try to extract location data using meta tags
    return await extractGenericUrl(url)
  } catch (error) {
    console.error("Error extracting place from URL:", error)
    return NextResponse.json({ error: "Failed to extract place information from URL" }, { status: 500 })
  }
}

async function extractGoogleMapsUrl(url: string): Promise<NextResponse> {
  try {
    // Handle short URLs
    if (url.includes("goo.gl/maps")) {
      const response = await fetch(url, { redirect: "follow" })
      url = response.url
    }

    // Extract coordinates from URL
    let lat: number | null = null
    let lng: number | null = null
    let name: string | null = null

    // Try to extract coordinates from URL patterns
    const coordsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const match = url.match(coordsRegex)

    if (match) {
      lat = Number.parseFloat(match[1])
      lng = Number.parseFloat(match[2])
    }

    // Try to extract place name from URL
    const placeNameRegex = /place\/([^/]+)/
    const nameMatch = url.match(placeNameRegex)

    if (nameMatch) {
      name = decodeURIComponent(nameMatch[1].replace(/\+/g, " "))
    }

    // If we couldn't extract coordinates or name, fetch the page and try to extract from meta tags
    if (!lat || !lng || !name) {
      const response = await fetch(url)
      const html = await response.text()
      const $ = cheerio.load(html)

      // Try to extract from meta tags
      const metaDescription = $('meta[name="description"]').attr("content")

      if (metaDescription) {
        // Try to extract coordinates from meta description
        const metaMatch = metaDescription.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
        if (metaMatch && !lat && !lng) {
          lat = Number.parseFloat(metaMatch[1])
          lng = Number.parseFloat(metaMatch[2])
        }

        // Try to extract name from title or meta description
        if (!name) {
          name = $("title").text().split(" - ")[0] || metaDescription.split(",")[0]
        }
      }
    }

    // If we still don't have coordinates or name, return an error
    if (!lat || !lng) {
      return NextResponse.json({ error: "Could not extract location coordinates from URL" }, { status: 400 })
    }

    if (!name) {
      name = "Unknown Place"
    }

    // Use reverse geocoding to get address
    const address = await getAddressFromCoordinates(lat, lng)

    const place: PlaceResult = {
      id: `gm-${Date.now()}`,
      name,
      address: address || "Unknown Address",
      lat,
      lng,
      type: "place",
      url,
    }

    return NextResponse.json({ place })
  } catch (error) {
    console.error("Error extracting from Google Maps URL:", error)
    return NextResponse.json({ error: "Failed to extract place information from Google Maps URL" }, { status: 500 })
  }
}

async function extractGenericUrl(url: string): Promise<NextResponse> {
  try {
    const response = await fetch(url)
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

    // Check for Schema.org location data
    if (!lat || !lng) {
      const schemaData = $('script[type="application/ld+json"]').html()
      if (schemaData) {
        try {
          const schema = JSON.parse(schemaData)
          if (schema.geo) {
            lat = schema.geo.latitude || schema.geo.lat
            lng = schema.geo.longitude || schema.geo.lng
          } else if (schema.location && schema.location.geo) {
            lat = schema.location.geo.latitude || schema.location.geo.lat
            lng = schema.location.geo.longitude || schema.location.geo.lng
          }

          if (schema.name) {
            name = schema.name
          }

          if (schema.address) {
            if (typeof schema.address === "string") {
              address = schema.address
            } else if (schema.address.streetAddress) {
              address = [
                schema.address.streetAddress,
                schema.address.addressLocality,
                schema.address.addressRegion,
                schema.address.postalCode,
                schema.address.addressCountry,
              ]
                .filter(Boolean)
                .join(", ")
            }
          }
        } catch (e) {
          console.error("Error parsing JSON-LD:", e)
        }
      }
    }

    // If we still don't have coordinates, check for generic meta tags
    if (!lat || !lng) {
      lat = Number.parseFloat($('meta[name="geo.position"][content*=";"]').attr("content")?.split(";")[0] || "")
      lng = Number.parseFloat($('meta[name="geo.position"][content*=";"]').attr("content")?.split(";")[1] || "")
    }

    // Get name from title if not found
    if (!name) {
      name = $("title").text().trim() || $('meta[property="og:title"]').attr("content") || "Unknown Place"
    }

    // If we couldn't extract coordinates, return an error
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Could not extract location coordinates from URL" }, { status: 400 })
    }

    // Use reverse geocoding to get address if not found
    if (!address) {
      address = await getAddressFromCoordinates(lat, lng)
    }

    const place: PlaceResult = {
      id: `url-${Date.now()}`,
      name,
      address: address || "Unknown Address",
      lat,
      lng,
      type: "place",
      url,
    }

    return NextResponse.json({ place })
  } catch (error) {
    console.error("Error extracting from generic URL:", error)
    return NextResponse.json({ error: "Failed to extract place information from URL" }, { status: 500 })
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
