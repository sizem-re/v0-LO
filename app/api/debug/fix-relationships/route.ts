import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { wrongId, correctId } = await request.json()

    if (!wrongId || !correctId) {
      return NextResponse.json({ error: "wrongId and correctId are required" }, { status: 400 })
    }

    console.log(`Fixing relationships: ${wrongId} -> ${correctId}`)

    const updates = []

    // Update places table
    const { data: placesData, error: placesError } = await supabaseAdmin
      .from("places")
      .update({ created_by: correctId })
      .eq("created_by", wrongId)
      .select()

    if (placesError) {
      console.error("Error updating places:", placesError)
    } else {
      updates.push({ table: "places", updated: placesData?.length || 0 })
    }

    // Update list_places table
    const { data: listPlacesData, error: listPlacesError } = await supabaseAdmin
      .from("list_places")
      .update({ added_by: correctId })
      .eq("added_by", wrongId)
      .select()

    if (listPlacesError) {
      console.error("Error updating list_places:", listPlacesError)
    } else {
      updates.push({ table: "list_places", updated: listPlacesData?.length || 0 })
    }

    // Update lists table
    const { data: listsData, error: listsError } = await supabaseAdmin
      .from("lists")
      .update({ owner_id: correctId })
      .eq("owner_id", wrongId)
      .select()

    if (listsError) {
      console.error("Error updating lists:", listsError)
    } else {
      updates.push({ table: "lists", updated: listsData?.length || 0 })
    }

    return NextResponse.json({
      success: true,
      message: `Updated relationships from ${wrongId} to ${correctId}`,
      updates,
    })
  } catch (error) {
    console.error("Error in fix-relationships endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
} 