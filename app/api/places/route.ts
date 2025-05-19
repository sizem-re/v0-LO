import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { getUserFromRequest } from "@/lib/auth-utils"

// GET /api/places - Get all places for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const listId = url.searchParams.get("listId")

    let query

    if (listId) {
      // Get places for a specific list
      query = supabase
        .from("places_lists")
        .select(`
          place:places(*)
        `)
        .eq("list_id", listId)
    } else {
      // Get all places created by the user
      query = supabase
        .from("places")
        .select(`
          *,
          lists:places_lists(
            list:lists(*)
          )
        `)
        .eq("user_id", user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching places:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data based on query type
    let transformedData

    if (listId) {
      // Extract places from the join table results
      transformedData = data.map((item) => item.place)
    } else {
      // Transform data to include list information
      transformedData = data.map((place) => {
        const lists = place.lists.map((l: any) => l.list).filter(Boolean)
        return {
          ...place,
          lists,
        }
      })
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error in GET /api/places:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/places - Create a new place
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { name, address, description, type, website, lat, lng, image_url, listIds } = body

    if (!name || !address || !lat || !lng) {
      return NextResponse.json(
        {
          error: "Name, address, and coordinates are required",
        },
        { status: 400 },
      )
    }

    // Start a transaction
    const { data: place, error: placeError } = await supabase
      .from("places")
      .insert({
        name,
        address,
        description,
        type,
        website,
        lat,
        lng,
        image_url,
        user_id: user.id,
        fid: user.fid || null,
      })
      .select()
      .single()

    if (placeError) {
      console.error("Error creating place:", placeError)
      return NextResponse.json({ error: placeError.message }, { status: 500 })
    }

    // If listIds are provided, add the place to those lists
    if (listIds && listIds.length > 0) {
      const placesListsData = listIds.map((listId) => ({
        place_id: place.id,
        list_id: listId,
        user_id: user.id,
      }))

      const { error: joinError } = await supabase.from("places_lists").insert(placesListsData)

      if (joinError) {
        console.error("Error adding place to lists:", joinError)
        // We don't return an error here since the place was created successfully
      }
    }

    return NextResponse.json(place)
  } catch (error) {
    console.error("Error in POST /api/places:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
