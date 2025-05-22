import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-client"
import { getAuthenticatedUser } from "@/lib/auth-context"

// DELETE endpoint to remove a place from a list
export async function DELETE(request: NextRequest) {
  try {
    const { listId, placeId } = await request.json()

    if (!listId || !placeId) {
      return NextResponse.json({ error: "List ID and Place ID are required" }, { status: 400 })
    }

    // Get authenticated user
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = createClient()

    // Check if user has permission to remove the place
    const { data: list } = await supabase.from("lists").select("owner_id, visibility").eq("id", listId).single()

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Check if user is the list owner or if it's a community list
    const isOwner = list.owner_id === user.id
    const isCommunity = list.visibility === "community"

    if (!isOwner && !isCommunity) {
      return NextResponse.json({ error: "You don't have permission to modify this list" }, { status: 403 })
    }

    // Get the list_places entry to check if user added this place
    const { data: listPlace } = await supabase
      .from("list_places")
      .select("*")
      .eq("list_id", listId)
      .eq("place_id", placeId)
      .single()

    if (!listPlace) {
      return NextResponse.json({ error: "Place not found in this list" }, { status: 404 })
    }

    // Check if user is the one who added the place or is the list owner
    const userAddedPlace = listPlace.added_by_user_id === user.id

    if (!isOwner && !userAddedPlace) {
      return NextResponse.json({ error: "You can only remove places that you added to this list" }, { status: 403 })
    }

    // Delete the list_places entry
    const { error } = await supabase.from("list_places").delete().eq("list_id", listId).eq("place_id", placeId)

    if (error) {
      console.error("Error removing place from list:", error)
      return NextResponse.json({ error: "Failed to remove place from list" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Place removed from list successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH endpoint to update a place in a list
export async function PATCH(request: NextRequest) {
  try {
    const { listId, placeId, updates } = await request.json()

    if (!listId || !placeId || !updates) {
      return NextResponse.json({ error: "List ID, Place ID, and updates are required" }, { status: 400 })
    }

    // Get authenticated user
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = createClient()

    // Check if user has permission to update the place
    const { data: list } = await supabase.from("lists").select("owner_id, visibility").eq("id", listId).single()

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Get the list_places entry to check if user added this place
    const { data: listPlace } = await supabase
      .from("list_places")
      .select("*")
      .eq("list_id", listId)
      .eq("place_id", placeId)
      .single()

    if (!listPlace) {
      return NextResponse.json({ error: "Place not found in this list" }, { status: 404 })
    }

    // Check if user is the list owner or the one who added the place
    const isOwner = list.owner_id === user.id
    const userAddedPlace = listPlace.added_by_user_id === user.id

    if (!isOwner && !userAddedPlace) {
      return NextResponse.json({ error: "You can only update places that you added to this list" }, { status: 403 })
    }

    // Update the place in the places table
    const { error: placeUpdateError } = await supabase
      .from("places")
      .update({
        name: updates.name,
        address: updates.address,
        website: updates.website,
        updated_at: new Date().toISOString(),
      })
      .eq("id", placeId)

    if (placeUpdateError) {
      console.error("Error updating place:", placeUpdateError)
      return NextResponse.json({ error: "Failed to update place" }, { status: 500 })
    }

    // Update the notes in the list_places table
    const { error: listPlaceUpdateError } = await supabase
      .from("list_places")
      .update({
        notes: updates.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("list_id", listId)
      .eq("place_id", placeId)

    if (listPlaceUpdateError) {
      console.error("Error updating list_place:", listPlaceUpdateError)
      return NextResponse.json({ error: "Failed to update place notes" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Place updated successfully",
      place: {
        ...listPlace,
        name: updates.name,
        address: updates.address,
        website: updates.website,
        notes: updates.notes,
      },
    })
  } catch (error) {
    console.error("Error in PATCH /api/list-places:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
