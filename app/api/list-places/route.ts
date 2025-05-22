import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

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

    // Check if the place is already in the list
    const { data: existingListPlace, error: checkError } = await supabaseAdmin
      .from("list_places")
      .select("id")
      .eq("list_id", list_id)
      .eq("place_id", place_id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if place exists in list:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingListPlace) {
      console.log("Place already exists in list")
      return NextResponse.json(
        { error: "This place is already in the list", id: existingListPlace.id },
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

    if (!id) {
      return NextResponse.json({ error: "List place ID is required" }, { status: 400 })
    }

    console.log(`Removing place with list_places ID: ${id}`)

    const { error } = await supabaseAdmin.from("list_places").delete().eq("id", id)

    if (error) {
      console.error("Error removing place from list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Place removed from list successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
