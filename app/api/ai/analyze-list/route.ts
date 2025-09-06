import { type NextRequest, NextResponse } from "next/server"
import { parseNaturalLanguageForList, extractFromUrl } from "@/lib/ai/natural-language"
import { analyzePhotoForList } from "@/lib/ai/photo-analysis"

interface ListAnalysisRequest {
  type: "natural_language" | "photo" | "link"
  text?: string
  image?: string // base64 encoded
  url?: string
}

interface ListAnalysisResult {
  title: string
  description: string
  suggestedPrivacy: "private" | "public" | "community"
  confidence: number
  extractedData?: {
    keywords?: string[]
    sentiment?: string
    category?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ListAnalysisRequest = await request.json()
    const { type, text, image, url } = body

    console.log(`[AI] Analyzing list creation request - type: ${type}`)

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

    let analysisResult: ListAnalysisResult

    switch (type) {
      case "natural_language":
        const nlpResult = await parseNaturalLanguageForList(text!)
        if (!nlpResult.success) {
          throw new Error(nlpResult.error)
        }
        analysisResult = convertNLPToListResult(nlpResult.data)
        break
      case "photo":
        const photoResult = await analyzePhotoForList(image!)
        if (!photoResult.success) {
          throw new Error(photoResult.error)
        }
        analysisResult = convertPhotoToListResult(photoResult.data)
        break
      case "link":
        const linkResult = await extractFromUrl(url!)
        if (!linkResult.success) {
          throw new Error(linkResult.error)
        }
        analysisResult = convertLinkToListResult(linkResult.data)
        break
      default:
        return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 })
    }

    console.log(`[AI] List analysis complete - confidence: ${analysisResult.confidence}`)

    return NextResponse.json({
      success: true,
      result: analysisResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in AI list analysis:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze list data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function convertNLPToListResult(nlpData: any): ListAnalysisResult {
  // Map AI result to expected format
  const suggestedPrivacy = nlpData.type === "public" ? "public" : nlpData.type === "community" ? "community" : "private"

  return {
    title: nlpData.title,
    description: nlpData.description,
    suggestedPrivacy,
    confidence: nlpData.confidence || 0.5,
    extractedData: {
      keywords: nlpData.suggestedPlaces || [],
      sentiment: "positive", // Could be enhanced with sentiment analysis
      category: nlpData.category,
    },
  }
}

function convertPhotoToListResult(photoData: any): ListAnalysisResult {
  return {
    title: photoData.title,
    description: photoData.description,
    suggestedPrivacy: "private", // Default for photo-based lists
    confidence: photoData.confidence || 0.75,
    extractedData: {
      keywords: photoData.suggestedPlaces || [],
      sentiment: photoData.atmosphere || "positive",
      category: photoData.category,
    },
  }
}

function convertLinkToListResult(linkData: any): ListAnalysisResult {
  return {
    title: linkData.title,
    description: linkData.description,
    suggestedPrivacy: "private", // Default for link-based lists
    confidence: linkData.confidence || 0.8,
    extractedData: {
      keywords: linkData.features || [],
      sentiment: "neutral",
      category: linkData.category,
    },
  }
}
