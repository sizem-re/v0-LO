import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const name = searchParams.get("name")
    const search = searchParams.get("search")
    const limit = searchParams.get("limit") || "100"

    let query = supabaseAdmin
      .from("places")
      .select(`
        *,
        list_count:list_places(count)
      `)
      .order("created_at", { ascending: false })

    // Filter by coordinates if provided
    if (lat && lng) {
      // Use a small radius to find places at almost the same location
      const latRadius = 0.0001 // Approximately 11 meters
      const lngRadius = 0.0001 // Varies by latitude

      const minLat = Number.parseFloat(lat) - latRadius
      const maxLat = Number.parseFloat(lat) + latRadius
      const minLng = Number.parseFloat(lng) - lngRadius
      const maxLng = Number.parseFloat(lng) + lngRadius

      query = query
        .gte("lat", minLat.toString())
        .lte("lat", maxLat.toString())
        .gte("lng", minLng.toString())
        .lte("lng", maxLng.toString())
    }

    // Filter by name if provided
    if (name) {
      query = query.ilike("name", `%${name}%`)
    }

    // Filter by search term across multiple fields
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,address.ilike.%${search}%,type.ilike.%${search}%,description.ilike.%${search}%`,
      )
    }

    // Apply limit
    query = query.limit(Number.parseInt(limit))

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, lat, lng, type, description, website_url, created_by } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: "Coordinates are required" }, { status: 400 })
    }

    console.log(`Creating new place: ${name}`, {
      name,
      address,
      lat,
      lng,
      type,
      description,
      website_url,
      created_by,
    })

    // Create the place with created_by field
    const { data: place, error } = await supabaseAdmin
      .from("places")
      .insert({
        name,
        address,
        lat: lat.toString(),
        lng: lng.toString(),
        type: type || "Place",
        description: description || "",
        website_url: website_url || "",
        created_by: created_by || null, // Ensure we store the user ID
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Place created successfully:", place)
    return NextResponse.json(place)
  } catch (error) {
    console.error("Error in POST /api/places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
