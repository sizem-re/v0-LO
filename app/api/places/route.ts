import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// GET /api/places - Get places (with filtering options)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const listId = searchParams.get("listId")
    const search = searchParams.get("search")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") ? Number.parseFloat(searchParams.get("radius") as string) : null

    let query = supabase.from("places").select("*")

    // Apply filters
    if (listId) {
      // Get places in a specific list
      const { data: listPlaces, error: listPlacesError } = await supabase
        .from("list_places")
        .select("place_id")
        .eq("list_id", listId)

      if (listPlacesError) {
        console.error("Error fetching list places:", listPlacesError)
        return NextResponse.json({ error: listPlacesError.message }, { status: 500 })
      }

      const placeIds = listPlaces.map((lp) => lp.place_id)
      if (placeIds.length > 0) {
        query = query.in("id", placeIds)
      } else {
        // No places in this list
        return NextResponse.json([])
      }
    }

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    if (lat && lng && radius) {
      // This is a simplified approach - for a real app, you'd want to use PostGIS or a similar solution
      const latNum = Number.parseFloat(lat)
      const lngNum = Number.parseFloat(lng)
      const radiusDegrees = radius / 111000 // Rough conversion from meters to degrees

      query = query
        .gte("lat", latNum - radiusDegrees)
        .lte("lat", latNum + radiusDegrees)
        .gte("lng", lngNum - radiusDegrees)
        .lte("lng", lngNum + radiusDegrees)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching places:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/places - Create a new place
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, address, lat, lng, type, createdBy, websiteUrl } = body

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: "Name, latitude, and longitude are required" }, { status: 400 })
    }

    // Generate a UUID for the new place
    const placeId = uuidv4()

    // Use the admin client to bypass RLS
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
        created_by: createdBy || null,
        website_url: websiteUrl || null,
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
