import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      console.log("List ID is missing")
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    console.log(`Fetching list with ID: ${id}`)

    // Fetch the list with its owner
    const { data: list, error: listError } = await supabaseAdmin
      .from("lists")
      .select(`
        *,
        owner:owner_id(id, farcaster_id, farcaster_username, farcaster_display_name, farcaster_pfp_url)
      `)
      .eq("id", id)
      .single()

    if (listError) {
      console.error("Error fetching list:", listError)
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    if (!list) {
      console.log(`List with ID ${id} not found`)
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    console.log(`List found: ${list.title}`)

    // Fetch the places in this list
    const { data: listPlaces, error: placesError } = await supabaseAdmin
      .from("list_places")
      .select(`
        id,
        note,
        photo_url,
        added_at,
        added_by,
        place_id
      `)
      .eq("list_id", id)

    if (placesError) {
      console.error("Error fetching list places:", placesError)
      return NextResponse.json({ error: placesError.message }, { status: 500 })
    }

    console.log(`Found ${listPlaces.length} places in the list`)

    // If there are no places, return the list with an empty places array
    if (listPlaces.length === 0) {
      return NextResponse.json({
        ...list,
        places: [],
      })
    }

    // Get all place IDs
    const placeIds = listPlaces.map((item) => item.place_id)

    // Fetch all places in one query
    const { data: places, error: placesDataError } = await supabaseAdmin.from("places").select("*").in("id", placeIds)

    if (placesDataError) {
      console.error("Error fetching places data:", placesDataError)
      return NextResponse.json({ error: placesDataError.message }, { status: 500 })
    }

    // Create a map of places for easy lookup
    const placesMap = places.reduce((acc, place) => {
      acc[place.id] = place
      return acc
    }, {})

    // Format the places data
    const formattedPlaces = listPlaces
      .map((item) => {
        const place = placesMap[item.place_id]

        if (!place) {
          console.warn(`Place with ID ${item.place_id} not found`)
          return null
        }

        return {
          id: place.id,
          name: place.name,
          type: place.type || "Place",
          address: place.address || "",
          coordinates: {
            lat: Number(place.lat) || 0,
            lng: Number(place.lng) || 0,
          },
          description: place.description || "",
          website: place.website_url || "",
          image: item.photo_url || "",
          notes: item.note || "",
          listPlaceId: item.id,
          addedAt: item.added_at,
          addedBy: item.added_by,
        }
      })
      .filter(Boolean)

    // Return the list with its places
    return NextResponse.json({
      ...list,
      places: formattedPlaces,
    })
  } catch (error) {
    console.error("Error in GET /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { title, description, visibility } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Validate visibility
    if (!["public", "private", "community"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility value" }, { status: 400 })
    }

    // First, check if the list exists and get the owner
    const { data: existingList, error: fetchError } = await supabaseAdmin
      .from("lists")
      .select("owner_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching list:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!existingList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Update the list
    const { data, error } = await supabaseAdmin
      .from("lists")
      .update({
        title,
        description,
        visibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in PUT /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    // First, check if the list exists
    const { data: existingList, error: fetchError } = await supabaseAdmin
      .from("lists")
      .select("id")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching list:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!existingList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // First delete all list_places entries
    const { error: listPlacesError } = await supabaseAdmin.from("list_places").delete().eq("list_id", id)

    if (listPlacesError) {
      console.error("Error deleting list places:", listPlacesError)
      return NextResponse.json({ error: listPlacesError.message }, { status: 500 })
    }

    // Then delete the list itself
    const { error: deleteError } = await supabaseAdmin.from("lists").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting list:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "List deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
