import { type NextRequest, NextResponse } from "next/server"
import { parseNaturalLanguageForPlace, extractFromUrl } from "@/lib/ai/natural-language"
import { analyzePhotoForPlace } from "@/lib/ai/photo-analysis"

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
        const nlpResult = await parseNaturalLanguageForPlace(text!)
        if (!nlpResult.success) {
          throw new Error(nlpResult.error)
        }
        analysisResult = await convertNLPToPlaceResult(nlpResult.data, text!)
        break
      case "photo":
        const photoResult = await analyzePhotoForPlace(image!)
        if (!photoResult.success) {
          throw new Error(photoResult.error)
        }
        analysisResult = await convertPhotoToPlaceResult(photoResult.data)
        break
      case "link":
        const linkResult = await extractFromUrl(url!)
        if (!linkResult.success) {
          throw new Error(linkResult.error)
        }
        analysisResult = await convertLinkToPlaceResult(linkResult.data, url!)
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

async function convertNLPToPlaceResult(nlpData: any, originalText: string): Promise<PlaceAnalysisResult> {
  const coordinates = nlpData.address ? await geocodeAddress(nlpData.address) : null
  const addressComponents = nlpData.address
    ? parseAddress(nlpData.address)
    : {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      }

  return {
    name: nlpData.name,
    address: nlpData.address || "Address not provided",
    coordinates,
    website: nlpData.website || "",
    description:
      nlpData.description || originalText.length > 300 ? originalText.substring(0, 300) + "..." : originalText,
    confidence: nlpData.confidence || 0.5,
    addressComponents,
    extractedData: {
      category: nlpData.category,
      businessHours: nlpData.businessHours || "",
      phoneNumber: nlpData.phoneNumber || "",
      priceRange: nlpData.priceRange || "",
    },
  }
}

async function convertPhotoToPlaceResult(photoData: any): Promise<PlaceAnalysisResult> {
  const coordinates = photoData.address ? await geocodeAddress(photoData.address) : null
  const addressComponents = photoData.address
    ? parseAddress(photoData.address)
    : {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      }

  return {
    name: photoData.name,
    address: photoData.address || "Address not available from photo",
    coordinates,
    website: photoData.website || "",
    description: photoData.description || "A place identified from the uploaded photo",
    confidence: photoData.confidence || 0.7,
    addressComponents,
    extractedData: {
      category: photoData.category,
      businessHours: photoData.businessHours || "",
      phoneNumber: photoData.phoneNumber || "",
      priceRange: photoData.priceRange || "",
    },
  }
}

async function convertLinkToPlaceResult(linkData: any, originalUrl: string): Promise<PlaceAnalysisResult> {
  const coordinates = linkData.address ? await geocodeAddress(linkData.address) : null
  const addressComponents = linkData.address
    ? parseAddress(linkData.address)
    : {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      }

  return {
    name: linkData.title || "Place from Link",
    address: linkData.address || "Address not found",
    coordinates,
    website: originalUrl,
    description: linkData.description || "A place extracted from the provided link",
    confidence: linkData.confidence || 0.75,
    addressComponents,
    extractedData: {
      category: linkData.category,
      businessHours: linkData.businessHours || "",
      phoneNumber: linkData.phoneNumber || "",
      priceRange: linkData.priceRange || "",
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
