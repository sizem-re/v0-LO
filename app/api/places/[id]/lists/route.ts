import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    console.log(`Fetching lists for place: ${placeId}`)

    // Get all lists that contain this place with proper joins
    const { data, error } = await supabase
      .from("list_places")
      .select(`
        list_id,
        lists!inner(
          id,
          title,
          description,
          visibility,
          owner_id,
          created_at
        )
      `)
      .eq("place_id", placeId)

    if (error) {
      console.error("Error fetching lists for place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data and get place counts for each list
    const listsWithCounts = await Promise.all(
      (data || []).map(async (item) => {
        const list = item.lists

        // Get the actual place count for this list
        const { count, error: countError } = await supabase
          .from("list_places")
          .select("*", { count: "exact", head: true })
          .eq("list_id", list.id)

        if (countError) {
          console.error(`Error getting count for list ${list.id}:`, countError)
        }

        return {
          id: list.id,
          title: list.title,
          description: list.description,
          visibility: list.visibility,
          owner_id: list.owner_id,
          created_at: list.created_at,
          place_count: count || 0,
        }
      }),
    )

    console.log(`Found ${listsWithCounts.length} lists for place ${placeId}`)
    return NextResponse.json(listsWithCounts)
  } catch (error) {
    console.error("Error in GET /api/places/[id]/lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
