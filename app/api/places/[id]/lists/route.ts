import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { getUserFromRequest } from "@/lib/auth-utils"

// POST /api/places/[id]/lists - Add a place to lists
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: placeId } = params
    const { listIds } = await request.json()

    if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
      return NextResponse.json({ error: "List IDs are required" }, { status: 400 })
    }

    // Check if place exists
    const { data: place, error: placeError } = await supabase.from("places").select("*").eq("id", placeId).single()

    if (placeError) {
      if (placeError.code === "PGRST116") {
        return NextResponse.json({ error: "Place not found" }, { status: 404 })
      }
      return NextResponse.json({ error: placeError.message }, { status: 500 })
    }

    // Check if all lists exist and user has access to them
    const { data: lists, error: listsError } = await supabase
      .from("lists")
      .select("*")
      .in("id", listIds)
      .or(`user_id.eq.${user.id},privacy.eq.open`)

    if (listsError) {
      return NextResponse.json({ error: listsError.message }, { status: 500 })
    }

    if (!lists || lists.length !== listIds.length) {
      return NextResponse.json(
        {
          error: "One or more lists not found or you don't have permission to add to them",
        },
        { status: 403 },
      )
    }

    // Add place to lists
    const placesListsData = listIds.map((listId) => ({
      place_id: placeId,
      list_id: listId,
      user_id: user.id,
    }))

    const { data, error } = await supabase
      .from("places_lists")
      .upsert(placesListsData, { onConflict: "place_id,list_id" })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in POST /api/places/[id]/lists:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/places/[id]/lists - Remove a place from lists
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: placeId } = params
    const { listIds } = await request.json()

    if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
      return NextResponse.json({ error: "List IDs are required" }, { status: 400 })
    }

    // Check if user has access to these lists
    const { data: lists, error: listsError } = await supabase
      .from("lists")
      .select("*")
      .in("id", listIds)
      .eq("user_id", user.id)

    if (listsError) {
      return NextResponse.json({ error: listsError.message }, { status: 500 })
    }

    if (!lists || lists.length !== listIds.length) {
      return NextResponse.json(
        {
          error: "One or more lists not found or you don't have permission to modify them",
        },
        { status: 403 },
      )
    }

    // Remove place from lists
    const { error } = await supabase
      .from("places_lists")
      .delete()
      .eq("place_id", placeId)
      .in("list_id", listIds)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/places/[id]/lists:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
