import { createGroq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
})

const PlaceAnalysisSchema = z.object({
  name: z.string().describe("The name of the place or business"),
  description: z.string().describe("A brief description of the place"),
  category: z.string().describe("Category like restaurant, park, shop, etc."),
  address: z.string().optional().describe("Any visible address or location info"),
  website: z.string().optional().describe("Any visible website or social media"),
  features: z.array(z.string()).describe("Notable features or characteristics"),
  atmosphere: z.string().describe("The mood or atmosphere of the place"),
  confidence: z.number().min(0).max(1).describe("Confidence in the analysis"),
})

const ListAnalysisSchema = z.object({
  title: z.string().describe("Suggested title for the list"),
  description: z.string().describe("Description of what this list represents"),
  category: z.string().describe("Category like food, culture, nature, etc."),
  theme: z.string().describe("The underlying theme or concept"),
  suggestedPlaces: z.array(z.string()).describe("Places that might fit this list"),
  confidence: z.number().min(0).max(1).describe("Confidence in the analysis"),
})

export async function analyzePhotoForPlace(imageUrl: string) {
  try {
    const { object } = await generateObject({
      model: groq("llava-v1.5-7b-4096-preview"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and extract information about the place shown. Look for business names, signage, architectural features, atmosphere, and any other details that would help identify and describe this location.",
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
      schema: PlaceAnalysisSchema,
      temperature: 0.3,
    })

    return {
      success: true,
      data: object,
    }
  } catch (error) {
    console.error("Photo analysis error:", error)
    return {
      success: false,
      error: "Failed to analyze photo",
    }
  }
}

export async function analyzePhotoForList(imageUrl: string) {
  try {
    const { object } = await generateObject({
      model: groq("llava-v1.5-7b-4096-preview"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and suggest what kind of list it might represent. Consider the theme, style, mood, or category of places that would fit with what you see in this image.",
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
      schema: ListAnalysisSchema,
      temperature: 0.4,
    })

    return {
      success: true,
      data: object,
    }
  } catch (error) {
    console.error("Photo analysis error:", error)
    return {
      success: false,
      error: "Failed to analyze photo",
    }
  }
}
