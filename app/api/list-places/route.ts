import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

// POST /api/list-places - Add a place to a list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listId, placeId, addedBy, note, photoUrl } = body

    if (!listId || !placeId || !addedBy) {
      return NextResponse.json({ error: "ListId, placeId, and addedBy are required" }, { status: 400 })
    }

    // Check if the place is already in the list
    const { data: existingEntry, error: checkError } = await supabase
      .from("list_places")
      .select("id")
      .eq("list_id", listId)
      .eq("place_id", placeId)
      .eq("added_by", addedBy)

    if (checkError) {
      console.error("Error checking list_places:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingEntry && existingEntry.length > 0) {
      // Update existing entry
      const { data, error } = await supabase
        .from("list_places")
        .update({
          note,
          photo_url: photoUrl,
          added_at: new Date().toISOString(),
        })
        .eq("id", existingEntry[0].id)
        .select()

      if (error) {
        console.error("Error updating list_places:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data[0])
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from("list_places")
        .insert({
          list_id: listId,
          place_id: placeId,
          added_by: addedBy,
          note,
          photo_url: photoUrl,
        })
        .select()

      if (error) {
        console.error("Error creating list_places:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data[0])
    }
  } catch (error) {
    console.error("Error in POST /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/list-places - Remove a place from a list
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const listId = searchParams.get("listId")
    const placeId = searchParams.get("placeId")
    const addedBy = searchParams.get("addedBy")

    if (!listId || !placeId) {
      return NextResponse.json({ error: "ListId and placeId are required" }, { status: 400 })
    }

    let query = supabase.from("list_places").delete().eq("list_id", listId).eq("place_id", placeId)

    if (addedBy) {
      query = query.eq("added_by", addedBy)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting from list_places:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
