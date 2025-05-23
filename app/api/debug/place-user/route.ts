import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("placeId")
    const listId = searchParams.get("listId")

    if (!placeId || !listId) {
      return NextResponse.json({ error: "placeId and listId are required" }, { status: 400 })
    }

    // Get the place data
    const { data: placeData, error: placeError } = await supabase
      .from("places")
      .select("*")
      .eq("id", placeId)
      .maybeSingle()

    // Get the list_places relationship
    const { data: listPlaceData, error: listPlaceError } = await supabase
      .from("list_places")
      .select("*")
      .eq("place_id", placeId)
      .eq("list_id", listId)
      .maybeSingle()

    // Get all list_places for this place
    const { data: allListPlaces, error: allListPlacesError } = await supabase
      .from("list_places")
      .select("*")
      .eq("place_id", placeId)

    // Get the list data
    const { data: listData, error: listError } = await supabase.from("lists").select("*").eq("id", listId).maybeSingle()

    // Get user data if we have an added_by field
    let userData = null
    const userId = listPlaceData?.added_by || placeData?.added_by
    if (userId) {
      const { data: userResult, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
      userData = userResult
    }

    return NextResponse.json({
      place: placeData,
      listPlace: listPlaceData,
      allListPlaces,
      list: listData,
      user: userData,
      userId,
      debug: {
        placeAddedBy: placeData?.added_by,
        listPlaceAddedBy: listPlaceData?.added_by,
        listOwnerId: listData?.owner_id,
      },
    })
  } catch (error) {
    console.error("Error in debug place-user route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
