import { type NextRequest, NextResponse } from "next/server"

interface AddressComponents {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface PlaceAnalysisRequest {
  type: "natural_language" | "photo" | "link"
  text?: string
  image?: string // base64 encoded
  url?: string
}

interface PlaceAnalysisResult {
  name: string
  address: string
  coordinates: { lat: number; lng: number } | null
  website: string
  description: string
  confidence: number
  addressComponents: AddressComponents
  extractedData?: {
    category?: string
    businessHours?: string
    phoneNumber?: string
    priceRange?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaceAnalysisRequest = await request.json()
    const { type, text, image, url } = body

    console.log(`[AI] Analyzing place creation request - type: ${type}`)

    // Validate input based on type
    if (type === "natural_language" && !text) {
      return NextResponse.json({ error: "Text is required for natural language analysis" }, { status: 400 })
    }
    if (type === "photo" && !image) {
      return NextResponse.json({ error: "Image is required for photo analysis" }, { status: 400 })
    }
    if (type === "link" && !url) {
      return NextResponse.json({ error: "URL is required for link analysis" }, { status: 400 })
    }

    let analysisResult: PlaceAnalysisResult

    switch (type) {
      case "natural_language":
        analysisResult = await analyzeNaturalLanguageForPlace(text!)
        break
      case "photo":
        analysisResult = await analyzePhotoForPlace(image!)
        break
      case "link":
        analysisResult = await analyzeLinkForPlace(url!)
        break
      default:
        return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 })
    }

    console.log(`[AI] Place analysis complete - confidence: ${analysisResult.confidence}`)

    return NextResponse.json({
      success: true,
      result: analysisResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in AI place analysis:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze place data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function analyzeNaturalLanguageForPlace(text: string): Promise<PlaceAnalysisResult> {
  console.log(`[AI] Processing natural language for place: "${text.substring(0, 100)}..."`)

  // Extract place name
  let name = "Unknown Place"
  const namePatterns = [
    /(?:called|named)\s+([^,.\n]+)/i,
    /(?:place|spot|restaurant|cafe|bar|shop)\s+(?:called|named)?\s*([^,.\n]+)/i,
    /([A-Z][a-zA-Z\s&']+?)(?:\s+(?:on|at|in)\s+)/i,
  ]

  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      name = match[1].trim()
      break
    }
  }

  // Extract address information
  const addressMatch = text.match(/(?:on|at|located at|address is)\s+([^.!?\n]+)/i)
  let address = "Address not provided"
  let addressComponents: AddressComponents = {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  }

  if (addressMatch) {
    address = addressMatch[1].trim()
    addressComponents = parseAddress(address)
  }

  // Try to geocode the address if we have Google Places API
  let coordinates: { lat: number; lng: number } | null = null
  if (address !== "Address not provided") {
    coordinates = await geocodeAddress(address)
  }

  // Extract website
  const websiteMatch = text.match(/(https?:\/\/[^\s]+)/i)
  const website = websiteMatch ? websiteMatch[1] : ""

  // Use the text as description
  const description = text.length > 300 ? text.substring(0, 300) + "..." : text

  // Calculate confidence
  const confidence = calculateConfidence(name, address, coordinates)

  return {
    name,
    address,
    coordinates,
    website,
    description,
    confidence,
    addressComponents,
    extractedData: {
      category: determinePlaceCategory(text),
      businessHours: extractBusinessHours(text),
      phoneNumber: extractPhoneNumber(text),
      priceRange: extractPriceRange(text),
    },
  }
}

async function analyzePhotoForPlace(imageBase64: string): Promise<PlaceAnalysisResult> {
  console.log("[AI] Processing photo for place analysis")

  // TODO: Implement actual image analysis using AI service (Google Vision, OpenAI Vision, etc.)
  // For now, return mock analysis

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return {
    name: "Place from Photo",
    address: "Address extracted from image analysis",
    coordinates: null,
    website: "",
    description: "A place identified from the uploaded photo",
    confidence: 0.7,
    addressComponents: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    extractedData: {
      category: "photo_location",
      businessHours: "",
      phoneNumber: "",
      priceRange: "",
    },
  }
}

async function analyzeLinkForPlace(url: string): Promise<PlaceAnalysisResult> {
  console.log(`[AI] Processing link for place analysis: ${url}`)

  // Check if it's a Google Maps or similar URL and use existing extraction
  if (url.includes("google.com/maps") || url.includes("goo.gl/maps") || url.includes("maps.app.goo.gl")) {
    return await extractFromMapsUrl(url)
  }

  // For other URLs, try to extract place information
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LO-AI-Bot/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Extract structured data or meta information
    const name = extractNameFromHtml(html)
    const address = extractAddressFromHtml(html)
    const website = url
    const description = extractDescriptionFromHtml(html)

    // Try to geocode the address
    const coordinates = address ? await geocodeAddress(address) : null
    const addressComponents = address
      ? parseAddress(address)
      : {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        }

    return {
      name,
      address: address || "Address not found",
      coordinates,
      website,
      description,
      confidence: 0.75,
      addressComponents,
      extractedData: {
        category: determinePlaceCategory(html),
        businessHours: extractBusinessHours(html),
        phoneNumber: extractPhoneNumber(html),
        priceRange: extractPriceRange(html),
      },
    }
  } catch (error) {
    console.error("Error analyzing link:", error)

    // Fallback analysis
    return {
      name: "Place from Link",
      address: "Address not available",
      coordinates: null,
      website: url,
      description: "A place extracted from the provided link",
      confidence: 0.5,
      addressComponents: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      extractedData: {
        category: "link_extraction",
        businessHours: "",
        phoneNumber: "",
        priceRange: "",
      },
    }
  }
}

async function extractFromMapsUrl(url: string): Promise<PlaceAnalysisResult> {
  // Use the existing URL extraction API
  try {
    const extractResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/places/extract-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      },
    )

    if (extractResponse.ok) {
      const extractData = await extractResponse.json()
      const place = extractData.place

      return {
        name: place.name,
        address: place.address,
        coordinates: place.coordinates,
        website: place.url,
        description: `Place extracted from Google Maps: ${place.name}`,
        confidence: 0.9,
        addressComponents: parseAddress(place.address),
        extractedData: {
          category: place.type,
          businessHours: "",
          phoneNumber: "",
          priceRange: "",
        },
      }
    }
  } catch (error) {
    console.error("Error using existing URL extraction:", error)
  }

  // Fallback if extraction fails
  return {
    name: "Place from Maps",
    address: "Address extraction failed",
    coordinates: null,
    website: url,
    description: "A place from Google Maps (extraction failed)",
    confidence: 0.6,
    addressComponents: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  }
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!googleApiKey) return null

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`
    const response = await fetch(geocodeUrl)

    if (response.ok) {
      const data = await response.json()
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return { lat: location.lat, lng: location.lng }
      }
    }
  } catch (error) {
    console.error("Geocoding error:", error)
  }

  return null
}

function parseAddress(address: string): AddressComponents {
  const parts = address.split(",").map((part) => part.trim())

  return {
    street: parts[0] || "",
    city: parts[1] || "",
    state: parts[2] || "",
    postalCode: parts[3] || "",
    country: parts[4] || "",
  }
}

function extractNameFromHtml(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    return titleMatch[1].trim().split(" - ")[0].split(" | ")[0]
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match) {
    return h1Match[1].trim()
  }

  return "Unknown Place"
}

function extractAddressFromHtml(html: string): string | null {
  // Look for structured data
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i)
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1])
      if (data.address) {
        if (typeof data.address === "string") return data.address
        if (data.address.streetAddress) {
          return `${data.address.streetAddress}, ${data.address.addressLocality}, ${data.address.addressRegion} ${data.address.postalCode}`
        }
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }

  // Look for address patterns in text
  const addressPattern = /\d+\s+[A-Za-z\s]+,\s+[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5}/
  const addressMatch = html.match(addressPattern)
  if (addressMatch) {
    return addressMatch[0]
  }

  return null
}

function extractDescriptionFromHtml(html: string): string {
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (descriptionMatch) {
    return descriptionMatch[1].trim()
  }

  return "Description extracted from website"
}

function determinePlaceCategory(text: string): string {
  const categories = {
    restaurant: ["restaurant", "dining", "food", "eat", "menu", "cuisine"],
    cafe: ["cafe", "coffee", "espresso", "latte", "cappuccino"],
    bar: ["bar", "pub", "drinks", "cocktail", "beer", "wine"],
    shop: ["shop", "store", "retail", "buy", "purchase"],
    hotel: ["hotel", "motel", "inn", "lodge", "accommodation"],
    attraction: ["museum", "gallery", "park", "monument", "attraction"],
    service: ["service", "repair", "clinic", "office", "professional"],
  }

  const lowercaseText = text.toLowerCase()

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowercaseText.includes(keyword))) {
      return category
    }
  }

  return "place"
}

function extractBusinessHours(text: string): string {
  const hoursPattern = /(?:hours?|open|closed)[\s:]*([^.\n]+(?:am|pm|AM|PM)[^.\n]*)/i
  const match = text.match(hoursPattern)
  return match ? match[1].trim() : ""
}

function extractPhoneNumber(text: string): string {
  const phonePattern = /(?:\+?1[-.\s]?)?$$?([0-9]{3})$$?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
  const match = text.match(phonePattern)
  return match ? match[0] : ""
}

function extractPriceRange(text: string): string {
  if (text.includes("$$$$$")) return "expensive"
  if (text.includes("$$$$")) return "expensive"
  if (text.includes("$$$")) return "moderate"
  if (text.includes("$$")) return "affordable"
  if (text.includes("$")) return "budget"
  return ""
}

function calculateConfidence(name: string, address: string, coordinates: { lat: number; lng: number } | null): number {
  let confidence = 0.5

  if (name !== "Unknown Place") confidence += 0.2
  if (address !== "Address not provided") confidence += 0.2
  if (coordinates) confidence += 0.1

  return Math.min(0.95, confidence)
}
