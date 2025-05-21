import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// GET /api/places - Get places (with filtering options)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const query = searchParams.get("query")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") // in kilometers

    let dbQuery = supabaseAdmin.from("places").select("*")

    // Apply filters
    if (userId) {
      dbQuery = dbQuery.eq("created_by", userId)
    }

    if (query) {
      dbQuery = dbQuery.ilike("name", `%${query}%`)
    }

    // If lat, lng, and radius are provided, filter by distance
    // Note: This is a simplified approach and might not be accurate for large distances
    if (lat && lng && radius) {
      const latFloat = Number.parseFloat(lat)
      const lngFloat = Number.parseFloat(lng)
      const radiusFloat = Number.parseFloat(radius)

      // Calculate bounding box for initial filtering (more efficient than calculating distance for every row)
      // 1 degree of latitude is approximately 111 kilometers
      const latDelta = radiusFloat / 111
      const lngDelta = radiusFloat / (111 * Math.cos((latFloat * Math.PI) / 180))

      dbQuery = dbQuery
        .gte("lat", latFloat - latDelta)
        .lte("lat", latFloat + latDelta)
        .gte("lng", lngFloat - lngDelta)
        .lte("lng", lngFloat + lngDelta)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error("Error fetching places:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to match our Place type
    const places = data.map((place) => ({
      id: place.id,
      name: place.name,
      type: place.type,
      address: place.address,
      coordinates: {
        lat: Number.parseFloat(place.lat),
        lng: Number.parseFloat(place.lng),
      },
      description: place.description,
      website: place.website_url,
    }))

    return NextResponse.json(places)
  } catch (error) {
    console.error("Error in GET /api/places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/places - Create a new place
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, address, lat, lng, type, website_url, created_by } = body

    if (!name || !lat || !lng) {
      return NextResponse.json({ error: "Name, latitude, and longitude are required" }, { status: 400 })
    }

    // Generate a UUID for the new place if not provided
    const placeId = id || uuidv4()

    const { data, error } = await supabaseAdmin
      .from("places")
      .insert({
        id: placeId,
        name,
        description,
        address,
        lat,
        lng,
        type,
        website_url,
        created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error creating place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in POST /api/places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
