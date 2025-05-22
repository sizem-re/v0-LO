import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get all lists that contain this place
    const { data, error } = await supabase
      .from("list_places")
      .select(`
        list_id,
        list:lists(
          id,
          title,
          description,
          visibility,
          owner_id,
          created_at,
          place_count
        )
      `)
      .eq("place_id", placeId)

    if (error) {
      console.error("Error fetching lists for place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to a more usable format
    const lists = data.map((item) => ({
      id: item.list.id,
      title: item.list.title,
      description: item.list.description,
      visibility: item.list.visibility,
      owner_id: item.list.owner_id,
      created_at: item.list.created_at,
      place_count: item.list.place_count || 0,
    }))

    return NextResponse.json(lists)
  } catch (error) {
    console.error("Error in GET /api/places/[id]/lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
