import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { generateRecommendations } from "@/lib/ai/natural-language"

interface RecommendationRequest {
  userId?: string
  location?: { lat: number; lng: number }
  preferences?: string[]
  listId?: string
  limit?: number
}

interface PlaceRecommendation {
  id: string
  name: string
  address: string
  coordinates: { lat: number; lng: number }
  category: string
  confidence: number
  reason: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()
    const { userId, location, preferences = [], listId, limit = 10 } = body

    console.log(`[AI] Generating recommendations for user: ${userId}`)

    // Get user's existing places and lists for context
    const userContext = userId ? await getUserContext(userId) : null

    // Get places near location if provided
    const nearbyPlaces = location ? await getNearbyPlaces(location, limit * 2) : []

    const contextString = buildContextString(userContext, preferences, nearbyPlaces)
    const aiRecommendations = await generateRecommendations(contextString, "place")

    if (!aiRecommendations.success) {
      // Fallback to original algorithm if AI fails
      const recommendations = await generateFallbackRecommendations({
        userContext,
        nearbyPlaces,
        preferences,
        location,
        limit,
      })

      return NextResponse.json({
        success: true,
        recommendations,
        context: {
          userPlacesCount: userContext?.places.length || 0,
          userListsCount: userContext?.lists.length || 0,
          nearbyPlacesCount: nearbyPlaces.length,
          preferences,
          method: "fallback",
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Convert AI suggestions to place recommendations
    const recommendations = await convertAIToRecommendations(aiRecommendations.data, nearbyPlaces, limit)

    console.log(`[AI] Generated ${recommendations.length} AI-powered recommendations`)

    return NextResponse.json({
      success: true,
      recommendations,
      context: {
        userPlacesCount: userContext?.places.length || 0,
        userListsCount: userContext?.lists.length || 0,
        nearbyPlacesCount: nearbyPlaces.length,
        preferences,
        method: "ai",
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function buildContextString(userContext: any, preferences: string[], nearbyPlaces: any[]): string {
  let context = "User context: "

  if (userContext?.places.length > 0) {
    const categories = userContext.places.map((p: any) => p.type || "place").slice(0, 5)
    context += `Previously saved places include: ${categories.join(", ")}. `
  }

  if (preferences.length > 0) {
    context += `User preferences: ${preferences.join(", ")}. `
  }

  if (nearbyPlaces.length > 0) {
    const nearbyTypes = nearbyPlaces.map((p) => p.type || "place").slice(0, 5)
    context += `Nearby places include: ${nearbyTypes.join(", ")}. `
  }

  return context + "Suggest similar places that would interest this user."
}

async function convertAIToRecommendations(
  aiSuggestions: string[],
  nearbyPlaces: any[],
  limit: number,
): Promise<PlaceRecommendation[]> {
  const recommendations: PlaceRecommendation[] = []

  // Match AI suggestions with actual nearby places
  for (const suggestion of aiSuggestions.slice(0, limit)) {
    // Try to find matching places in nearby results
    const matchingPlace = nearbyPlaces.find(
      (place) =>
        place.name.toLowerCase().includes(suggestion.toLowerCase()) ||
        suggestion.toLowerCase().includes(place.name.toLowerCase()) ||
        (place.type && suggestion.toLowerCase().includes(place.type.toLowerCase())),
    )

    if (matchingPlace) {
      recommendations.push({
        id: matchingPlace.id,
        name: matchingPlace.name,
        address: matchingPlace.address,
        coordinates: {
          lat: Number.parseFloat(matchingPlace.lat),
          lng: Number.parseFloat(matchingPlace.lng),
        },
        category: matchingPlace.type || "place",
        confidence: 0.85, // High confidence for AI matches
        reason: `AI suggested: ${suggestion}`,
      })
    } else {
      // Create a conceptual recommendation
      recommendations.push({
        id: `ai-${Date.now()}-${Math.random()}`,
        name: suggestion,
        address: "Location to be determined",
        coordinates: { lat: 0, lng: 0 },
        category: "suggestion",
        confidence: 0.7,
        reason: "AI-generated suggestion based on your preferences",
      })
    }
  }

  return recommendations
}

async function getUserContext(userId: string) {
  try {
    // Get user's places
    const { data: userPlaces } = await supabase
      .from("list_places")
      .select(`
        place:places(*),
        list:lists(*)
      `)
      .eq("added_by", userId)
      .limit(50)

    // Get user's lists
    const { data: userLists } = await supabase.from("lists").select("*").eq("owner_id", userId).limit(20)

    return {
      places: userPlaces?.map((up) => up.place) || [],
      lists: userLists || [],
    }
  } catch (error) {
    console.error("Error getting user context:", error)
    return { places: [], lists: [] }
  }
}

async function getNearbyPlaces(location: { lat: number; lng: number }, limit: number) {
  try {
    // Simple distance-based query (in a real implementation, you'd use PostGIS or similar)
    const radius = 0.01 // Approximately 1km

    const { data: places } = await supabase
      .from("places")
      .select("*")
      .gte("lat", (location.lat - radius).toString())
      .lte("lat", (location.lat + radius).toString())
      .gte("lng", (location.lng - radius).toString())
      .lte("lng", (location.lng + radius).toString())
      .limit(limit)

    return places || []
  } catch (error) {
    console.error("Error getting nearby places:", error)
    return []
  }
}

async function generateFallbackRecommendations({
  userContext,
  nearbyPlaces,
  preferences,
  location,
  limit,
}: {
  userContext: any
  nearbyPlaces: any[]
  preferences: string[]
  location?: { lat: number; lng: number }
  limit: number
}): Promise<PlaceRecommendation[]> {
  const recommendations: PlaceRecommendation[] = []

  // Analyze user's place preferences
  const userCategories =
    userContext?.places.reduce((acc: { [key: string]: number }, place: any) => {
      const category = place.type || "place"
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {}) || {}

  // Score nearby places based on user preferences
  for (const place of nearbyPlaces) {
    const category = place.type || "place"
    let confidence = 0.5

    // Boost confidence if user has similar places
    if (userCategories[category]) {
      confidence += Math.min(0.3, userCategories[category] * 0.1)
    }

    // Boost confidence if matches preferences
    if (
      preferences.some(
        (pref) =>
          place.name.toLowerCase().includes(pref.toLowerCase()) ||
          place.address.toLowerCase().includes(pref.toLowerCase()) ||
          category.toLowerCase().includes(pref.toLowerCase()),
      )
    ) {
      confidence += 0.2
    }

    // Calculate distance factor if location provided
    if (location) {
      const distance = calculateDistance(location, {
        lat: Number.parseFloat(place.lat),
        lng: Number.parseFloat(place.lng),
      })

      // Prefer closer places
      if (distance < 0.5) confidence += 0.1
      else if (distance > 2) confidence -= 0.1
    }

    const reason = generateRecommendationReason(place, userCategories, preferences)

    recommendations.push({
      id: place.id,
      name: place.name,
      address: place.address,
      coordinates: { lat: Number.parseFloat(place.lat), lng: Number.parseFloat(place.lng) },
      category,
      confidence: Math.min(0.95, Math.max(0.1, confidence)),
      reason,
    })
  }

  // Sort by confidence and return top results
  return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit)
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function generateRecommendationReason(
  place: any,
  userCategories: { [key: string]: number },
  preferences: string[],
): string {
  const category = place.type || "place"

  if (userCategories[category] > 0) {
    return `Similar to ${userCategories[category]} other ${category}${userCategories[category] > 1 ? "s" : ""} you've saved`
  }

  if (preferences.some((pref) => place.name.toLowerCase().includes(pref.toLowerCase()))) {
    return "Matches your stated preferences"
  }

  if (preferences.some((pref) => category.toLowerCase().includes(pref.toLowerCase()))) {
    return `${category} matching your interests`
  }

  return "Popular place in this area"
}

export async function GET(request: NextRequest) {
  // Simple GET endpoint for health check
  return NextResponse.json({
    status: "AI Recommendations API is running",
    timestamp: new Date().toISOString(),
  })
}
