import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listId = params.id

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    // First, get the list details
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select(`
        *,
        owner:users(id, farcaster_username, farcaster_display_name, farcaster_pfp_url)
      `)
      .eq("id", listId)
      .single()

    if (listError) {
      console.error("Error fetching list:", listError)
      return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 })
    }

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Then, get the list_places entries for this list
    const { data: listPlaces, error: listPlacesError } = await supabase
      .from("list_places")
      .select("id, place_id, added_at, added_by, note, photo_url")
      .eq("list_id", listId)

    if (listPlacesError) {
      console.error("Error fetching list places:", listPlacesError)
      return NextResponse.json({ error: "Failed to fetch list places" }, { status: 500 })
    }

    // If there are no places, return the list with an empty places array
    if (!listPlaces || listPlaces.length === 0) {
      return NextResponse.json({
        ...list,
        places: [],
      })
    }

    // Get all place IDs
    const placeIds = listPlaces.map((lp) => lp.place_id)

    // Fetch all places in one query
    const { data: places, error: placesError } = await supabase.from("places").select("*").in("id", placeIds)

    if (placesError) {
      console.error("Error fetching places:", placesError)
      return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
    }

    // Combine list_places with places
    const placesWithDetails = listPlaces.map((lp) => {
      const place = places.find((p) => p.id === lp.place_id)
      return {
        id: lp.id,
        place: place || null,
        added_at: lp.added_at,
        added_by: lp.added_by,
        note: lp.note,
        photo_url: lp.photo_url,
      }
    })

    // Return the list with places
    return NextResponse.json({
      ...list,
      places: placesWithDetails,
    })
  } catch (error) {
    console.error("Error in GET /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listId = params.id

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    // Use the admin client to bypass RLS
    const { error } = await supabaseAdmin.from("lists").delete().eq("id", listId)

    if (error) {
      console.error("Error deleting list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listId = params.id
    const body = await request.json()
    const { title, description, visibility, coverImageUrl } = body

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Use the admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("lists")
      .update({
        title,
        description,
        visibility: visibility || "private",
        cover_image_url: coverImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listId)
      .select()

    if (error) {
      console.error("Error updating list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in PATCH /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
