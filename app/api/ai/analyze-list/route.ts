import { type NextRequest, NextResponse } from "next/server"

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
        analysisResult = await analyzeNaturalLanguageForList(text!)
        break
      case "photo":
        analysisResult = await analyzePhotoForList(image!)
        break
      case "link":
        analysisResult = await analyzeLinkForList(url!)
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

async function analyzeNaturalLanguageForList(text: string): Promise<ListAnalysisResult> {
  console.log(`[AI] Processing natural language for list: "${text.substring(0, 100)}..."`)

  // TODO: Replace with actual AI service (OpenAI, Anthropic, etc.)
  // For now, implement rule-based analysis

  const lowercaseText = text.toLowerCase()

  // Extract potential title
  let title = "My List"
  const titlePatterns = [
    /(?:list of|collection of|my favorite|best)\s+([^.!?]+)/i,
    /(?:places for|spots for|locations for)\s+([^.!?]+)/i,
    /([^.!?]+?)(?:\s+(?:list|collection|places|spots))/i,
  ]

  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      title = match[1].trim()
      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1)
      break
    }
  }

  // Generate description
  const description = text.length > 200 ? text.substring(0, 200) + "..." : text

  // Determine privacy based on content
  let suggestedPrivacy: "private" | "public" | "community" = "private"
  if (lowercaseText.includes("share") || lowercaseText.includes("recommend") || lowercaseText.includes("others")) {
    suggestedPrivacy = "public"
  } else if (
    lowercaseText.includes("collaborate") ||
    lowercaseText.includes("contribute") ||
    lowercaseText.includes("add")
  ) {
    suggestedPrivacy = "community"
  }

  // Extract keywords
  const keywords = extractKeywords(text)

  // Calculate confidence based on text quality
  const confidence = Math.min(0.95, Math.max(0.6, text.length / 200))

  return {
    title,
    description,
    suggestedPrivacy,
    confidence,
    extractedData: {
      keywords,
      sentiment: determineSentiment(text),
      category: determineCategory(text),
    },
  }
}

async function analyzePhotoForList(imageBase64: string): Promise<ListAnalysisResult> {
  console.log("[AI] Processing photo for list analysis")

  // TODO: Implement actual image analysis using AI service
  // For now, return mock analysis

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  return {
    title: "Photo Collection",
    description: "A collection of places captured in photos",
    suggestedPrivacy: "private",
    confidence: 0.75,
    extractedData: {
      keywords: ["photos", "visual", "memories"],
      sentiment: "positive",
      category: "photography",
    },
  }
}

async function analyzeLinkForList(url: string): Promise<ListAnalysisResult> {
  console.log(`[AI] Processing link for list analysis: ${url}`)

  try {
    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LO-AI-Bot/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Extract title and description from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)

    const title = titleMatch ? titleMatch[1].trim() : "Bookmarked List"
    const description = descriptionMatch ? descriptionMatch[1].trim() : "A list created from a bookmarked link"

    return {
      title,
      description,
      suggestedPrivacy: "private",
      confidence: 0.8,
      extractedData: {
        keywords: extractKeywords(title + " " + description),
        sentiment: "neutral",
        category: "bookmarks",
      },
    }
  } catch (error) {
    console.error("Error analyzing link:", error)

    // Fallback analysis
    return {
      title: "Bookmarked List",
      description: "A list created from a shared link",
      suggestedPrivacy: "private",
      confidence: 0.6,
      extractedData: {
        keywords: ["bookmark", "link", "shared"],
        sentiment: "neutral",
        category: "bookmarks",
      },
    }
  }
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)

  // Remove common stop words
  const stopWords = new Set([
    "this",
    "that",
    "with",
    "have",
    "will",
    "from",
    "they",
    "know",
    "want",
    "been",
    "good",
    "much",
    "some",
    "time",
    "very",
    "when",
    "come",
    "here",
    "just",
    "like",
    "long",
    "make",
    "many",
    "over",
    "such",
    "take",
    "than",
    "them",
    "well",
    "were",
  ])

  const keywords = words
    .filter((word) => !stopWords.has(word))
    .reduce((acc: { [key: string]: number }, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {})

  return Object.entries(keywords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}

function determineSentiment(text: string): string {
  const positiveWords = [
    "love",
    "favorite",
    "best",
    "amazing",
    "great",
    "wonderful",
    "excellent",
    "perfect",
    "beautiful",
    "awesome",
  ]
  const negativeWords = ["hate", "worst", "terrible", "awful", "bad", "horrible", "disappointing"]

  const lowercaseText = text.toLowerCase()
  const positiveCount = positiveWords.filter((word) => lowercaseText.includes(word)).length
  const negativeCount = negativeWords.filter((word) => lowercaseText.includes(word)).length

  if (positiveCount > negativeCount) return "positive"
  if (negativeCount > positiveCount) return "negative"
  return "neutral"
}

function determineCategory(text: string): string {
  const categories = {
    food: ["restaurant", "cafe", "food", "eat", "dining", "coffee", "bar", "drink"],
    travel: ["travel", "trip", "vacation", "visit", "destination", "hotel", "flight"],
    entertainment: ["movie", "music", "show", "concert", "theater", "entertainment", "fun"],
    shopping: ["shop", "store", "buy", "purchase", "mall", "market"],
    nature: ["park", "nature", "outdoor", "hiking", "beach", "mountain", "forest"],
    culture: ["museum", "art", "history", "culture", "gallery", "monument"],
  }

  const lowercaseText = text.toLowerCase()

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowercaseText.includes(keyword))) {
      return category
    }
  }

  return "general"
}
