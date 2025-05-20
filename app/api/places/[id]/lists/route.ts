import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    // Get all lists that contain this place
    const { data, error } = await supabaseAdmin
      .from("list_places")
      .select(`
        list_id,
        lists:list_id (
          id,
          title,
          description,
          visibility,
          owner_id,
          created_at,
          updated_at,
          cover_image_url
        )
      `)
      .eq("place_id", placeId)

    if (error) {
      console.error("Error fetching place lists:", error)
      return NextResponse.json({ error: "Failed to fetch place lists" }, { status: 500 })
    }

    // Extract the lists from the joined data
    const lists = data.map((item) => item.lists)

    return NextResponse.json(lists)
  } catch (error) {
    console.error("Error in GET /api/places/[id]/lists:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
