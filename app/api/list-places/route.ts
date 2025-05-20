import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// POST /api/list-places - Add a place to a list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listId, placeId, userId, note, photoUrl } = body

    if (!listId || !placeId) {
      return NextResponse.json({ error: "List ID and Place ID are required" }, { status: 400 })
    }

    // Generate a UUID for the new list-place relationship
    const id = uuidv4()

    // Use the admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("list_places")
      .insert({
        id,
        list_id: listId,
        place_id: placeId,
        added_by: userId || null,
        note: note || null,
        photo_url: photoUrl || null,
        added_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error adding place to list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
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
    const id = searchParams.get("id")

    if ((!listId || !placeId) && !id) {
      return NextResponse.json(
        { error: "Either list ID and place ID, or the relationship ID are required" },
        { status: 400 },
      )
    }

    let query = supabaseAdmin.from("list_places").delete()

    if (id) {
      query = query.eq("id", id)
    } else {
      query = query.eq("list_id", listId).eq("place_id", placeId)
    }

    const { error } = await query

    if (error) {
      console.error("Error removing place from list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
