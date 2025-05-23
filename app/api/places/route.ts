import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const name = searchParams.get("name")
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"

    let query = supabaseAdmin.from("places").select(`
        *,
        list_places!inner(
          id,
          list_id,
          added_by,
          added_at,
          notes,
          lists!inner(
            id,
            title,
            type,
            created_by
          )
        )
      `)

    // Filter by coordinates if provided (for map-based queries)
    if (lat && lng) {
      const latRadius = 0.0001
      const lngRadius = 0.0001
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

    // General search across name, address, and type
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,type.ilike.%${search}%`)
    }

    // Filter by specific name
    if (name && !search) {
      query = query.ilike("name", `%${name}%`)
    }

    // Filter by type
    if (type) {
      query = query.eq("type", type)
    }

    // Apply pagination
    query = query
      .range(Number.parseInt(offset), Number.parseInt(offset) + Number.parseInt(limit) - 1)
      .order("created_at", { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching places:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to include list information
    const transformedData =
      data?.map((place) => ({
        ...place,
        lists: place.list_places?.map((lp) => lp.lists) || [],
        addedAt: place.list_places?.[0]?.added_at || place.created_at,
        notes: place.list_places?.[0]?.notes || place.description,
      })) || []

    return NextResponse.json({
      places: transformedData,
      total: count,
      hasMore: Number.parseInt(offset) + Number.parseInt(limit) < (count || 0),
    })
  } catch (error) {
    console.error("Error in GET /api/places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, lat, lng, type, description, website_url } = body

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
    })

    // Create the place
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
