import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

interface PlaceCoordinates {
  lat: number
  lng: number
}

interface Place {
  id: string
  name: string
  address: string
  coordinates: PlaceCoordinates
  type: string
  url: string
}

// Default coordinates (center of Tacoma, WA)
const DEFAULT_COORDINATES: PlaceCoordinates = {
  lat: 47.2529,
  lng: -122.4443,
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("=== URL EXTRACTION DEBUG ===")
    console.log("Original URL:", url)

    // Check if it's a Google Knowledge Graph URL (g.co/kgs format)
    if (url.includes("g.co/kgs/")) {
      return await extractGoogleKnowledgeGraphUrl(url)
    }

    // Check if it's a Google Maps URL
    if (url.includes("google.com/maps") || url.includes("goo.gl/maps") || url.includes("maps.app.goo.gl")) {
      return await extractGoogleMapsUrl(url)
    }

    // For other URLs, try to extract location data using Google Places API
    return await extractGenericUrl(url)
  } catch (error) {
    console.error("Error extracting place from URL:", error)
    return NextResponse.json(
      { error: "Failed to extract place information from URL", details: (error as Error).message },
      { status: 500 },
    )
  }
}

async function extractGoogleKnowledgeGraphUrl(url: string): Promise<NextResponse> {
  try {
    console.log("Processing Google Knowledge Graph URL:", url)

    // First, we need to follow the redirect to get the actual page
    console.log("Following redirect for Knowledge Graph URL...")
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const finalUrl = response.url
    console.log("Redirected to:", finalUrl)

    // Get the HTML content
    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract business name
    const name = $("title").text().split(" - ")[0].trim()
    console.log("Extracted name:", name)

    // Try to extract address
    let address = ""
    const addressElement = $('span:contains("Address:")').next()
    if (addressElement.length) {
      address = addressElement.text().trim()
    } else {
      // Look for address in the page content
      $("div").each((_, element) => {
        const text = $(element).text()
        if (text.match(/\d+\s+[A-Za-z\s]+,\s+[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5}/)) {
          address = text.trim()
          return false // break the loop
        }
      })
    }

    console.log("Extracted address:", address)

    // If we have a name but no address, search for the place using Google Places API
    if (name && !address) {
      console.log("Searching for place using name:", name)
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

      if (googleApiKey) {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(name)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`

        try {
          const searchResponse = await fetch(searchUrl)
          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            console.log("Google Places search response:", searchData)

            if (searchData.status === "OK" && searchData.candidates && searchData.candidates.length > 0) {
              const place = searchData.candidates[0]
              console.log("Found place using name search:", place.name)

              return NextResponse.json({
                place: {
                  id: place.place_id || `kg-${Date.now()}`,
                  name: place.name,
                  address: place.formatted_address || "Address not available",
                  coordinates: place.geometry?.location
                    ? {
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng,
                      }
                    : DEFAULT_COORDINATES,
                  type: getPlaceType(place.types || []),
                  url: finalUrl,
                },
              })
            }
          }
        } catch (searchError) {
          console.error("Error searching Google Places API:", searchError)
        }
      }
    }

    // If we have an address, try to geocode it
    if (address) {
      console.log("Geocoding address:", address)
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

      if (googleApiKey) {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`

        try {
          const geocodeResponse = await fetch(geocodeUrl)
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()

            if (geocodeData.status === "OK" && geocodeData.results && geocodeData.results.length > 0) {
              const result = geocodeData.results[0]
              console.log("Successfully geocoded address")

              return NextResponse.json({
                place: {
                  id: `kg-${Date.now()}`,
                  name: name || address.split(",")[0],
                  address: result.formatted_address,
                  coordinates: result.geometry?.location
                    ? {
                        lat: result.geometry.location.lat,
                        lng: result.geometry.location.lng,
                      }
                    : DEFAULT_COORDINATES,
                  type: "business",
                  url: finalUrl,
                },
              })
            }
          }
        } catch (geocodeError) {
          console.error("Error geocoding address:", geocodeError)
        }
      }
    }

    // If we couldn't use Google Places API or geocoding, return partial data
    console.log("Returning partial place data with default coordinates")
    return NextResponse.json({
      place: {
        id: `kg-${Date.now()}`,
        name: name || "Unknown Place",
        address: address || "Address not available",
        coordinates: DEFAULT_COORDINATES,
        type: "business",
        url: finalUrl,
      },
    })
  } catch (error) {
    console.error("Error extracting from Google Knowledge Graph URL:", error)
    return NextResponse.json(
      {
        error: "Failed to extract place information from Google Knowledge Graph URL",
        details: (error as Error).message,
      },
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

    // Extract place_id from URL if available
    let placeId = null
    const placeIdMatch = url.match(/place_id=([^&]+)/)
    if (placeIdMatch) {
      placeId = placeIdMatch[1]
      console.log("Found place_id in URL:", placeId)
    }

    // If we have a place_id, use the Google Places API to get details
    if (placeId) {
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
      if (!googleApiKey) {
        console.error("Google Places API key not found")
        return NextResponse.json(
          { error: "Google Places API key not found", details: "API key is required for place details" },
          { status: 500 },
        )
      }

      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,types,url&key=${googleApiKey}`
      console.log("Fetching place details from Google API:", detailsUrl)

      try {
        const detailsResponse = await fetch(detailsUrl)
        if (!detailsResponse.ok) {
          console.error("Google Places API error:", detailsResponse.statusText)
          throw new Error(`Google Places API error: ${detailsResponse.statusText}`)
        }

        const detailsData = await detailsResponse.json()
        if (detailsData.status !== "OK") {
          console.error("Google Places API error:", detailsData.status, detailsData.error_message)
          throw new Error(
            `Google Places API error: ${detailsData.status} - ${detailsData.error_message || "Unknown error"}`,
          )
        }

        const place = detailsData.result
        console.log("Successfully retrieved place details:", place.name)

        return NextResponse.json({
          place: {
            id: place.place_id,
            name: place.name,
            address: place.formatted_address || "Address not available",
            coordinates: place.geometry?.location
              ? {
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                }
              : DEFAULT_COORDINATES,
            type: getPlaceType(place.types || []),
            url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          },
        })
      } catch (apiError) {
        console.error("Error fetching place details:", apiError)
      }
    }

    // Extract coordinates from URL
    let lat: number | null = null
    let lng: number | null = null
    let query: string | null = null

    console.log("Trying to extract coordinates from URL...")

    // Try multiple regex patterns for different Google Maps URL formats
    const patterns = [
      { name: "@pattern", regex: /@(-?\d+\.\d+),(-?\d+\.\d+)/ },
      { name: "!3d pattern", regex: /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/ },
      { name: "ll pattern", regex: /ll=(-?\d+\.\d+),(-?\d+\.\d+)/ },
      { name: "center pattern", regex: /center=(-?\d+\.\d+),(-?\d+\.\d+)/ },
      { name: "q pattern with coords", regex: /q=(-?\d+\.\d+),(-?\d+\.\d+)/ },
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern.regex)
      if (match) {
        console.log(`Found coordinates using ${pattern.name}:`, match[1], match[2])
        if (pattern.name === "!3d pattern") {
          lat = Number.parseFloat(match[1])
          lng = Number.parseFloat(match[2])
        } else {
          lat = Number.parseFloat(match[1])
          lng = Number.parseFloat(match[2])
        }
        break
      }
    }

    // Try to extract query from URL
    const queryPatterns = [
      { name: "q pattern", regex: /q=([^&]+)/ },
      { name: "query pattern", regex: /query=([^&]+)/ },
      { name: "place pattern", regex: /place\/([^/]+)/ },
      { name: "search pattern", regex: /search\/([^/]+)/ },
    ]

    for (const pattern of queryPatterns) {
      const match = url.match(pattern.regex)
      if (match) {
        console.log(`Found query using ${pattern.name}:`, match[1])
        query = decodeURIComponent(match[1].replace(/\+/g, " "))
        // Remove coordinates from query if they exist
        query = query.replace(/^-?\d+\.\d+,-?\d+\.\d+/, "").trim()
        if (query) break
      }
    }

    // If we have coordinates, use reverse geocoding
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      console.log("Using coordinates for reverse geocoding:", lat, lng)
      const coordinates = { lat, lng }

      // Use Google Places API for reverse geocoding
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
      if (googleApiKey) {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`
        console.log("Fetching address from Google Geocoding API")

        try {
          const geocodeResponse = await fetch(geocodeUrl)
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()

            if (geocodeData.status === "OK" && geocodeData.results && geocodeData.results.length > 0) {
              const result = geocodeData.results[0]

              return NextResponse.json({
                place: {
                  id: `gm-${Date.now()}`,
                  name: query || result.formatted_address.split(",")[0],
                  address: result.formatted_address,
                  coordinates,
                  type: "place",
                  url,
                },
              })
            }
          }
        } catch (geocodeError) {
          console.error("Error with reverse geocoding:", geocodeError)
        }
      }

      // If Google geocoding fails, return with coordinates but without address
      return NextResponse.json({
        place: {
          id: `gm-${Date.now()}`,
          name: query || "Location from Google Maps",
          address: "Address not available",
          coordinates,
          type: "place",
          url,
        },
      })
    }

    // If we have a query but no coordinates, use Google Places API to search
    if (query) {
      console.log("Using query for place search:", query)

      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
      if (!googleApiKey) {
        console.error("Google Places API key not found")
        return NextResponse.json(
          { error: "Google Places API key not found", details: "API key is required for place search" },
          { status: 500 },
        )
      }

      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`
      console.log("Searching for place using Google API:", searchUrl)

      try {
        const searchResponse = await fetch(searchUrl)
        if (!searchResponse.ok) {
          console.error("Google Places API error:", searchResponse.statusText)
          throw new Error(`Google Places API error: ${searchResponse.statusText}`)
        }

        const searchData = await searchResponse.json()
        if (searchData.status !== "OK") {
          console.error("Google Places API error:", searchData.status, searchData.error_message)
          throw new Error(
            `Google Places API error: ${searchData.status} - ${searchData.error_message || "Unknown error"}`,
          )
        }

        if (searchData.candidates && searchData.candidates.length > 0) {
          const place = searchData.candidates[0]
          console.log("Found place using query:", place.name)

          return NextResponse.json({
            place: {
              id: place.place_id || `gm-${Date.now()}`,
              name: place.name,
              address: place.formatted_address || "Address not available",
              coordinates: place.geometry?.location
                ? {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                  }
                : DEFAULT_COORDINATES,
              type: getPlaceType(place.types || []),
              url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            },
          })
        }
      } catch (searchError) {
        console.error("Error searching for place:", searchError)
      }
    }

    // If all else fails, try to fetch the page and extract information
    try {
      console.log("Fetching page content to extract data")
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
      const html = await response.text()
      const $ = cheerio.load(html)

      // Try to extract the title for use as a query
      const title = $("title").text().trim()
      console.log("Extracted title from page:", title)

      if (title) {
        // Use the title as a query for Google Places API
        const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
        if (googleApiKey) {
          const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(title)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`
          console.log("Searching for place using page title as query")

          try {
            const searchResponse = await fetch(searchUrl)
            if (searchResponse.ok) {
              const searchData = await searchResponse.json()

              if (searchData.status === "OK" && searchData.candidates && searchData.candidates.length > 0) {
                const place = searchData.candidates[0]
                console.log("Found place using page title as query:", place.name)

                return NextResponse.json({
                  place: {
                    id: place.place_id || `gm-${Date.now()}`,
                    name: place.name,
                    address: place.formatted_address || "Address not available",
                    coordinates: place.geometry?.location
                      ? {
                          lat: place.geometry.location.lat,
                          lng: place.geometry.location.lng,
                        }
                      : DEFAULT_COORDINATES,
                    type: getPlaceType(place.types || []),
                    url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                  },
                })
              }
            }
          } catch (searchError) {
            console.error("Error searching with title:", searchError)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching page content:", error)
    }

    // If all else fails, return an error
    console.error("Could not extract place information from URL")
    return NextResponse.json(
      {
        error: "Could not extract location coordinates from URL",
        details:
          "The URL doesn't contain recognizable location data. Please try a different URL or add the place manually.",
        debug: { originalUrl: url, extractedLat: lat, extractedLng: lng, extractedQuery: query },
      },
      { status: 400 },
    )
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

    // Use Google Places API to search for the URL
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
    if (googleApiKey) {
      // First, try to extract the business name from the URL
      let businessName = ""

      // Extract domain name
      const domainMatch = url.match(/https?:\/\/(?:www\.)?([^/]+)/)
      if (domainMatch) {
        const domain = domainMatch[1]
        // Convert domain to potential business name
        businessName = domain
          .split(".")[0] // Take the first part of the domain
          .replace(/-/g, " ") // Replace hyphens with spaces
      }

      // If we have a business name, search for it
      if (businessName) {
        console.log("Extracted business name from URL:", businessName)
        const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(businessName)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`

        try {
          const searchResponse = await fetch(searchUrl)
          if (searchResponse.ok) {
            const searchData = await searchResponse.json()

            if (searchData.status === "OK" && searchData.candidates && searchData.candidates.length > 0) {
              const place = searchData.candidates[0]
              console.log("Found place using business name:", place.name)

              return NextResponse.json({
                place: {
                  id: place.place_id || `url-${Date.now()}`,
                  name: place.name,
                  address: place.formatted_address || "Address not available",
                  coordinates: place.geometry?.location
                    ? {
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng,
                      }
                    : DEFAULT_COORDINATES,
                  type: getPlaceType(place.types || []),
                  url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                },
              })
            }
          }
        } catch (searchError) {
          console.error("Error searching with business name:", searchError)
        }
      }
    }

    // Fallback to fetching the URL and extracting metadata
    console.log("Falling back to metadata extraction")
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    // Extract the page title for use as a query
    const html = await response.text()
    const $ = cheerio.load(html)
    const title = $("title").text().trim()

    console.log("Extracted title from page:", title)

    // Use the title as a query for Google Places API
    if (googleApiKey && title) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(title)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`
      console.log("Searching for place using page title as query")

      try {
        const searchResponse = await fetch(searchUrl)
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()

          if (searchData.status === "OK" && searchData.candidates && searchData.candidates.length > 0) {
            const place = searchData.candidates[0]
            console.log("Found place using page title as query:", place.name)

            return NextResponse.json({
              place: {
                id: place.place_id || `url-${Date.now()}`,
                name: place.name,
                address: place.formatted_address || "Address not available",
                coordinates: place.geometry?.location
                  ? {
                      lat: place.geometry.location.lat,
                      lng: place.geometry.location.lng,
                    }
                  : DEFAULT_COORDINATES,
                type: getPlaceType(place.types || []),
                url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
              },
            })
          }
        }
      } catch (searchError) {
        console.error("Error searching with title:", searchError)
      }
    }

    // If all else fails, return with just the title and default coordinates
    if (title) {
      return NextResponse.json({
        place: {
          id: `url-${Date.now()}`,
          name: title,
          address: "Address not available",
          coordinates: DEFAULT_COORDINATES,
          type: "place",
          url: url,
        },
      })
    }

    // If all else fails, return an error
    console.error("Could not extract place information from URL")
    return NextResponse.json(
      {
        error: "Could not extract location coordinates from URL",
        details: "The website doesn't contain recognizable location data",
        fallbackOption: "manualEntry",
      },
      { status: 400 },
    )
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

// Helper function to get a friendly place type from Google Places types
function getPlaceType(types: string[]): string {
  if (types.includes("restaurant")) return "restaurant"
  if (types.includes("cafe")) return "cafe"
  if (types.includes("bar")) return "bar"
  if (types.includes("lodging")) return "hotel"
  if (types.includes("park")) return "park"
  if (types.includes("museum")) return "museum"
  if (types.includes("store") || types.includes("shop")) return "shop"
  if (types.includes("airport")) return "airport"
  if (types.includes("train_station")) return "station"
  if (types.includes("bus_station")) return "station"
  if (types.includes("subway_station")) return "station"
  if (types.includes("point_of_interest")) return "attraction"
  if (types.includes("establishment")) return "business"
  if (types.includes("locality") || types.includes("administrative_area_level_1")) return "city"
  return "place"
}
