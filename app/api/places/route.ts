import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

// GET /api/places - Get places (with filtering options)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const listId = searchParams.get("listId")
    const query = searchParams.get("query")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") // in kilometers

    let dbQuery = supabase.from("places").select(`
      *,
      created_by:users(farcaster_username, farcaster_display_name, farcaster_pfp_url),
      lists:list_places(
        list_id,
        list:lists(title, visibility)
      )
    `)

    // Apply filters
    if (listId) {
      dbQuery = dbQuery.eq("lists.list_id", listId)
    }

    if (query) {
      dbQuery = dbQuery.ilike("name", `%${query}%`)
    }

    // Location-based search
    if (lat && lng && radius) {
      // This is a simplified approach - for production, consider using PostGIS for more accurate geospatial queries
      const latNum = Number.parseFloat(lat)
      const lngNum = Number.parseFloat(lng)
      const radiusNum = Number.parseFloat(radius)

      // Approximate conversion of kilometers to degrees (this varies by latitude)
      const latDelta = radiusNum / 111.0 // 1 degree of latitude is approximately 111 km
      const lngDelta = radiusNum / (111.0 * Math.cos((latNum * Math.PI) / 180))

      dbQuery = dbQuery
        .gte("lat", latNum - latDelta)
        .lte("lat", latNum + latDelta)
        .gte("lng", lngNum - lngDelta)
        .lte("lng", lngNum + lngDelta)
    }

    const { data, error } = await dbQuery

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
    const { name, address, lat, lng, description, type, websiteUrl, createdBy, listId } = body

    if (!name || !address || !lat || !lng) {
      return NextResponse.json({ error: "Name, address, lat, and lng are required" }, { status: 400 })
    }

    // Start a transaction
    const { data: place, error: placeError } = await supabase
      .from("places")
      .insert({
        name,
        address,
        lat,
        lng,
        description,
        type,
        website_url: websiteUrl,
        created_by: createdBy,
      })
      .select()

    if (placeError) {
      console.error("Error creating place:", placeError)
      return NextResponse.json({ error: placeError.message }, { status: 500 })
    }

    // If listId is provided, add the place to the list
    if (listId && place && place.length > 0) {
      const { error: listPlaceError } = await supabase.from("list_places").insert({
        list_id: listId,
        place_id: place[0].id,
        added_by: createdBy,
      })

      if (listPlaceError) {
        console.error("Error adding place to list:", listPlaceError)
        // We don't return an error here since the place was created successfully
      }
    }

    return NextResponse.json(place[0])
  } catch (error) {
    console.error("Error in POST /api/places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
