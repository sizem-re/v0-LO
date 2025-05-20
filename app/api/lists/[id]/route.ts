import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    // Fetch the list with its owner and places
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select(`
        *,
        owner:users(id, farcaster_id, farcaster_username, farcaster_display_name, farcaster_pfp_url)
      `)
      .eq("id", id)
      .single()

    if (listError) {
      console.error("Error fetching list:", listError)
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Fetch the places in this list
    const { data: listPlaces, error: placesError } = await supabase
      .from("list_places")
      .select(`
        id,
        note,
        photo_url,
        added_at,
        added_by,
        place:places(*)
      `)
      .eq("list_id", id)

    if (placesError) {
      console.error("Error fetching list places:", placesError)
      return NextResponse.json({ error: placesError.message }, { status: 500 })
    }

    // Format the places data
    const places = listPlaces.map((item) => ({
      id: item.place.id,
      name: item.place.name,
      type: item.place.type,
      address: item.place.address,
      coordinates: {
        lat: Number.parseFloat(item.place.lat),
        lng: Number.parseFloat(item.place.lng),
      },
      description: item.place.description,
      website: item.place.website_url,
      image: item.photo_url,
      notes: item.note,
      listPlaceId: item.id,
      addedAt: item.added_at,
      addedBy: item.added_by,
    }))

    // Return the list with its places
    return NextResponse.json({
      ...list,
      places,
    })
  } catch (error) {
    console.error("Error in GET /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
