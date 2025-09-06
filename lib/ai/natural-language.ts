import { createGroq } from "@ai-sdk/groq"
import { generateObject, generateText } from "ai"
import { z } from "zod"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
})

const PlaceExtractionSchema = z.object({
  name: z.string().describe("The name of the place"),
  description: z.string().describe("A description of the place"),
  address: z.string().optional().describe("Any address or location mentioned"),
  website: z.string().optional().describe("Any website or URL mentioned"),
  category: z.string().describe("Category like restaurant, park, shop, etc."),
  features: z.array(z.string()).describe("Notable features or characteristics mentioned"),
  notes: z.string().optional().describe("Additional notes or personal thoughts"),
  confidence: z.number().min(0).max(1).describe("Confidence in the extraction"),
})

const ListExtractionSchema = z.object({
  title: z.string().describe("A concise title for the list"),
  description: z.string().describe("A description of what this list represents"),
  type: z.enum(["public", "community", "private"]).describe("Suggested list type based on content"),
  category: z.string().describe("Category like food, culture, nature, etc."),
  theme: z.string().describe("The underlying theme or concept"),
  suggestedPlaces: z.array(z.string()).describe("Places that might fit this list based on the description"),
  confidence: z.number().min(0).max(1).describe("Confidence in the extraction"),
})

const LinkExtractionSchema = z.object({
  title: z.string().describe("Title extracted from the page"),
  description: z.string().describe("Description or summary of the content"),
  address: z.string().optional().describe("Any address found"),
  category: z.string().describe("Category of the place or content"),
  website: z.string().describe("The original URL"),
  features: z.array(z.string()).describe("Key features or highlights"),
  confidence: z.number().min(0).max(1).describe("Confidence in the extraction"),
})

export async function parseNaturalLanguageForPlace(text: string) {
  try {
    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting place information from natural language descriptions. Parse the user's text and extract structured information about a place they want to add to their location list.",
        },
        {
          role: "user",
          content: `Extract place information from this description: "${text}"`,
        },
      ],
      schema: PlaceExtractionSchema,
      temperature: 0.3,
    })

    return {
      success: true,
      data: object,
    }
  } catch (error) {
    console.error("NLP place parsing error:", error)
    return {
      success: false,
      error: "Failed to parse place description",
    }
  }
}

export async function parseNaturalLanguageForList(text: string) {
  try {
    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      messages: [
        {
          role: "system",
          content:
            "You are an expert at understanding list concepts from natural language. Parse the user's description and create a structured list concept with title, description, and suggested places.",
        },
        {
          role: "user",
          content: `Create a list concept from this description: "${text}"`,
        },
      ],
      schema: ListExtractionSchema,
      temperature: 0.4,
    })

    return {
      success: true,
      data: object,
    }
  } catch (error) {
    console.error("NLP list parsing error:", error)
    return {
      success: false,
      error: "Failed to parse list description",
    }
  }
}

export async function extractFromUrl(url: string) {
  try {
    // First, fetch the page content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LO-Bot/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Extract text content (simplified - in production you'd use a proper HTML parser)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000) // Limit content length

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting place information from web pages. Analyze the content and extract structured information about the place or business.",
        },
        {
          role: "user",
          content: `Extract place information from this webpage content. URL: ${url}\n\nContent: ${textContent}`,
        },
      ],
      schema: LinkExtractionSchema,
      temperature: 0.3,
    })

    return {
      success: true,
      data: object,
    }
  } catch (error) {
    console.error("URL extraction error:", error)
    return {
      success: false,
      error: "Failed to extract information from URL",
    }
  }
}

export async function generateRecommendations(context: string, type: "place" | "list") {
  try {
    const prompt =
      type === "place"
        ? `Based on this context: "${context}", suggest 5 similar or related places that would fit well in the same list. Focus on places with similar themes, vibes, or categories.`
        : `Based on this context: "${context}", suggest 5 list ideas that are related or would appeal to someone interested in this topic. Think about complementary themes and interests.`

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      messages: [
        {
          role: "system",
          content:
            "You are an expert at making thoughtful recommendations for places and lists. Provide creative, relevant suggestions that show deep understanding of user interests.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    })

    // Parse the response into an array of suggestions
    const suggestions = text
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((suggestion) => suggestion.length > 0)
      .slice(0, 5)

    return {
      success: true,
      data: suggestions,
    }
  } catch (error) {
    console.error("Recommendations error:", error)
    return {
      success: false,
      error: "Failed to generate recommendations",
    }
  }
}
