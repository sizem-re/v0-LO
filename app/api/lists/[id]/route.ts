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
