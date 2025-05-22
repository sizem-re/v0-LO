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

    // Extract the code from the URL to use as a unique identifier
    const kgCode = url.split("/").pop() || ""
    console.log("Knowledge Graph code:", kgCode)

    // For Knowledge Graph URLs, we need to use a proxy approach
    // Instead of trying to fetch the URL directly (which can cause CORS issues),
    // we'll use a server-side proxy to get the actual Google search page

    try {
      // Make a server-side request to follow the redirect
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.9",
        },
      })

      clearTimeout(timeoutId)

      // Get the final URL after redirects
      const finalUrl = response.url
      console.log("Redirected to:", finalUrl)

      if (response.ok) {
        const html = await response.text()
        const $ = cheerio.load(html)

        // Try multiple approaches to extract the business name

        // 1. Look for the main heading (usually the business name)
        let businessName = ""

        // Try to get the title from the page
        const title = $("title").text().trim()
        console.log("Page title:", title)

        // Extract business name from title (remove " - Google Search" if present)
        if (title) {
          businessName = title.split(" - ")[0].trim()
          console.log("Extracted business name from title:", businessName)
        }

        // 2. Try to find the business name in the Knowledge Panel
        if (!businessName || businessName.includes("Google Search")) {
          // Look for the main heading in the Knowledge Panel
          const kgHeading = $("h2").first().text().trim()
          if (kgHeading) {
            businessName = kgHeading
            console.log("Extracted business name from heading:", businessName)
          }
        }

        // 3. Try to find address information
        let address = ""

        // Look for address in the page
        $("span:contains('Address:')").each((_, element) => {
          const addressElement = $(element).next()
          if (addressElement.length) {
            address = addressElement.text().trim()
            console.log("Found address:", address)
          }
        })

        // If we couldn't find the address with the label, try to find it by pattern
        if (!address) {
          $("div").each((_, element) => {
            const text = $(element).text()
            // Look for US address pattern
            if (text.match(/\d+\s+[A-Za-z\s]+,\s+[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5}/)) {
              address = text.trim()
              console.log("Found address by pattern:", address)
              return false // break the loop
            }
          })
        }

        // If we have a business name, use it to search for the place
        if (businessName && !businessName.includes("Google Search")) {
          console.log("Searching for place using business name:", businessName)

          // If we have an address, include it in the search query for better results
          let searchQuery = businessName
          if (address) {
            // Extract city and state from address if possible
            const cityStateMatch = address.match(/([^,]+),\s*([A-Z]{2})/)
            if (cityStateMatch) {
              const city = cityStateMatch[1].trim()
              searchQuery = `${businessName} ${city}`
              console.log("Enhanced search query with city:", searchQuery)
            }
          }

          return await searchPlaceByName(searchQuery, url)
        }

        // If we couldn't extract a business name but have an address, try geocoding
        if (address && !businessName) {
          console.log("Geocoding address:", address)
          return await geocodeAddress(address, url)
        }
      }
    } catch (error) {
      console.log("Error fetching Knowledge Graph URL:", error)
      // Continue with fallback approaches
    }

    // If we couldn't extract a title, return a partial result with the URL
    // This allows the user to manually complete the information
    return NextResponse.json({
      partialPlace: {
        name: "Place from Google",
        url: url,
        coordinates: { lat: 47.6062, lng: -122.3321 }, // Default to Seattle coordinates
      },
      message: "Could not automatically extract place details. Please complete the information.",
    })
  } catch (error) {
    console.error("Error extracting from Google Knowledge Graph URL:", error)
    return NextResponse.json(
      {
        error: "Failed to extract place information from Google Knowledge Graph URL",
        details: (error as Error).message,
        fallbackOption: "manualEntry",
      },
      { status: 500 },
    )
  }
}

async function geocodeAddress(address: string, originalUrl: string): Promise<NextResponse> {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!googleApiKey) {
    console.error("Google Places API key not found")
    return NextResponse.json(
      { error: "Google Places API key not found", details: "API key is required for geocoding" },
      { status: 500 },
    )
  }

  try {
    console.log("Geocoding address:", address)
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`

    const geocodeResponse = await fetch(geocodeUrl)
    if (geocodeResponse.ok) {
      const geocodeData = await geocodeResponse.json()

      if (geocodeData.status === "OK" && geocodeData.results && geocodeData.results.length > 0) {
        const result = geocodeData.results[0]
        console.log("Successfully geocoded address")

        // Extract the place name from the address components
        let name = address.split(",")[0].trim()

        // Try to find a more specific name in the address components
        for (const component of result.address_components) {
          if (component.types.includes("point_of_interest") || component.types.includes("establishment")) {
            name = component.long_name
            break
          }
        }

        return NextResponse.json({
          place: {
            id: `geo-${Date.now()}`,
            name: name,
            address: result.formatted_address,
            coordinates: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            },
            type: "place",
            url: originalUrl,
          },
        })
      }
    }

    // If geocoding fails, return partial data
    return NextResponse.json({
      partialPlace: {
        name: address.split(",")[0].trim(),
        address: address,
        url: originalUrl,
        coordinates: { lat: 47.6062, lng: -122.3321 }, // Default to Seattle coordinates
      },
      message: "Address extracted but could not be geocoded. Please verify the location.",
    })
  } catch (error) {
    console.error("Error geocoding address:", error)
    return NextResponse.json(
      {
        error: "Failed to geocode address",
        details: (error as Error).message,
        fallbackOption: "manualEntry",
      },
      { status: 500 },
    )
  }
}

async function searchPlaceByName(searchQuery: string, originalUrl: string): Promise<NextResponse> {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!googleApiKey) {
    console.error("Google Places API key not found")
    return NextResponse.json(
      { error: "Google Places API key not found", details: "API key is required for place search" },
      { status: 500 },
    )
  }

  // Try Find Place API first
  const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${googleApiKey}`

  try {
    console.log("Searching for place using Find Place API:", searchQuery)
    const findPlaceResponse = await fetch(findPlaceUrl)

    if (findPlaceResponse.ok) {
      const findPlaceData = await findPlaceResponse.json()

      if (findPlaceData.status === "OK" && findPlaceData.candidates && findPlaceData.candidates.length > 0) {
        const place = findPlaceData.candidates[0]
        console.log("Found place using Find Place API:", place.name)

        return NextResponse.json({
          place: {
            id: place.place_id || `kg-${Date.now()}`,
            name: place.name,
            address: place.formatted_address,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            type: getPlaceType(place.types || []),
            url: originalUrl,
          },
        })
      }
    }

    // If Find Place doesn't work, try Text Search API
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleApiKey}`

    console.log("Searching for place using Text Search API:", searchQuery)
    const textSearchResponse = await fetch(textSearchUrl)

    if (textSearchResponse.ok) {
      const textSearchData = await textSearchResponse.json()

      if (textSearchData.status === "OK" && textSearchData.results && textSearchData.results.length > 0) {
        const place = textSearchData.results[0]
        console.log("Found place using Text Search API:", place.name)

        return NextResponse.json({
          place: {
            id: place.place_id || `kg-${Date.now()}`,
            name: place.name,
            address: place.formatted_address,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            type: getPlaceType(place.types || []),
            url: originalUrl,
          },
        })
      }
    }

    // If all else fails, return partial data with the search query as the name
    return NextResponse.json({
      partialPlace: {
        name: searchQuery,
        url: originalUrl,
        coordinates: { lat: 47.6062, lng: -122.3321 }, // Default to Seattle coordinates
      },
      message: "Place name extracted but location not found. Please verify the address.",
    })
  } catch (error) {
    console.error("Error searching for place:", error)
    return NextResponse.json(
      {
        error: "Failed to search for place",
        details: (error as Error).message,
        fallbackOption: "manualEntry",
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
          address: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          type: getPlaceType(place.types || []),
          url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        },
      })
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

      // Use Google Places API for reverse geocoding
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
      if (googleApiKey) {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`
        console.log("Fetching address from Google Geocoding API")

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
                coordinates: {
                  lat,
                  lng,
                },
                type: "place",
                url,
              },
            })
          }
        }
      }

      // If Google geocoding fails, return partial data
      return NextResponse.json({
        partialPlace: {
          name: query || "Location from Google Maps",
          coordinates: {
            lat,
            lng,
          },
          url,
        },
        message: "Coordinates extracted. Please complete the location details.",
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
            address: place.formatted_address,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            type: getPlaceType(place.types || []),
            url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          },
        })
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
                  address: place.formatted_address,
                  coordinates: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                  },
                  type: getPlaceType(place.types || []),
                  url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                },
              })
            }
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
                address: place.formatted_address,
                coordinates: {
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                },
                type: getPlaceType(place.types || []),
                url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
              },
            })
          }
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
              address: place.formatted_address,
              coordinates: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
              },
              type: getPlaceType(place.types || []),
              url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            },
          })
        }
      }
    }

    // If all else fails, return partial data with just the title
    if (title) {
      return NextResponse.json({
        partialPlace: {
          name: title,
          url: url,
          coordinates: { lat: 47.6062, lng: -122.3321 }, // Default to Seattle coordinates
        },
        message: "Website title extracted. Please complete the location details.",
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
