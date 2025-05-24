import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase-client"

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

    // Try to get user data using multiple strategies
    let userData = null
    let userLookupDetails = []
    
    const possibleUserIds = [
      listPlaceData?.added_by,
      listPlaceData?.creator_id,
      placeData?.added_by,
      placeData?.created_by,
      listData?.owner_id
    ].filter(Boolean)

    console.log("Possible user IDs found:", possibleUserIds)

    for (const userId of possibleUserIds) {
      console.log(`Trying to fetch user with ID: ${userId}`)
      
      const { data: userResult, error: userError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      userLookupDetails.push({
        userId,
        found: !!userResult,
        error: userError?.message,
        userData: userResult
      })

      if (userResult && !userData) {
        userData = userResult
        console.log(`Found user data:`, userResult)
      }
    }

    return NextResponse.json({
      place: placeData,
      listPlace: listPlaceData,
      allListPlaces,
      list: listData,
      user: userData,
      userLookupDetails,
      debug: {
        placeAddedBy: placeData?.added_by,
        placeCreatedBy: placeData?.created_by,
        listPlaceAddedBy: listPlaceData?.added_by,
        listPlaceCreatorId: listPlaceData?.creator_id,
        listOwnerId: listData?.owner_id,
        possibleUserIds,
      },
    })
  } catch (error) {
    console.error("Error in debug place-user route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
