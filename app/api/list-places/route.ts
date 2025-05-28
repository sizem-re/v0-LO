import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

// GET /api/list-places - Find list-place relationship
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get("listId")
    const placeId = searchParams.get("placeId")
    const id = searchParams.get("id")

    // If we have an ID, get that specific list-place entry
    if (id) {
      const { data, error } = await supabaseAdmin
        .from("list_places")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error fetching list-place by ID:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // If we have listId and placeId, find the relationship
    if (listId && placeId) {
      const { data, error } = await supabaseAdmin
        .from("list_places")
        .select("*")
        .eq("list_id", listId)
        .eq("place_id", placeId)
        .maybeSingle()

      if (error) {
        console.error("Error fetching list-place relationship:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Either 'id' or both 'listId' and 'placeId' are required" }, { status: 400 })
  } catch (error) {
    console.error("Error in GET /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/list-places - Add a place to a list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { list_id, place_id, note, added_by } = body

    // Validate required fields
    if (!list_id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    if (!place_id) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    if (!added_by) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Adding place ${place_id} to list ${list_id}`)

    // Check if the place is already in the list - get more details for debugging
    const { data: existingListPlace, error: checkError } = await supabaseAdmin
      .from("list_places")
      .select("id, added_at, added_by, place:place_id(name)")
      .eq("list_id", list_id)
      .eq("place_id", place_id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if place exists in list:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingListPlace) {
      console.log("Place already exists in list:", existingListPlace)

      // Get place details for better error message
      const { data: placeDetails } = await supabaseAdmin.from("places").select("name").eq("id", place_id).single()

      const placeName = placeDetails?.name || "This place"

      return NextResponse.json(
        {
          error: `${placeName} is already in this list`,
          existingPlace: existingListPlace,
          alreadyExists: true,
        },
        { status: 409 },
      )
    }

    // Add the place to the list
    const { data: listPlace, error: insertError } = await supabaseAdmin
      .from("list_places")
      .insert({
        list_id,
        place_id,
        note,
        added_by,
        added_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error adding place to list:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log("Place added to list successfully:", listPlace)
    return NextResponse.json(listPlace)
  } catch (error) {
    console.error("Error in POST /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/list-places - Remove a place from a list
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    console.log("DELETE /api/list-places - Request params:", { id })

    if (!id) {
      return NextResponse.json({ error: "List place ID is required" }, { status: 400 })
    }

    console.log(`Removing place with list_places ID: ${id}`)

    // First, get the list_place record to confirm it exists
    const { data: listPlace, error: fetchError } = await supabaseAdmin
      .from("list_places")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      console.error("Error fetching list_place record:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!listPlace) {
      console.error("List place record not found with ID:", id)
      return NextResponse.json({ error: "List place record not found" }, { status: 404 })
    }

    // Now delete the record
    const { error: deleteError } = await supabaseAdmin.from("list_places").delete().eq("id", id)

    if (deleteError) {
      console.error("Error removing place from list:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log("Place removed from list successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/list-places - Update a place in a list
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, note } = body

    console.log("PATCH /api/list-places - Request body:", body)

    if (!id) {
      return NextResponse.json({ error: "List place ID is required" }, { status: 400 })
    }

    console.log(`Updating place with list_places ID: ${id}`)

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (note !== undefined) {
      updates.note = note
    }

    const { data, error } = await supabaseAdmin.from("list_places").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating place in list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Place updated in list successfully:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PATCH /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
