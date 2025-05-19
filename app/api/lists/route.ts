import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

// GET /api/lists - Get lists (with filtering options)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const visibility = searchParams.get("visibility")
    const fid = searchParams.get("fid")

    // If fid is provided, get the user's ID from Supabase
    let dbUserId = userId
    if (fid && !userId) {
      const { data: userData } = await supabase.from("users").select("id").eq("farcaster_id", fid).single()

      if (userData) {
        dbUserId = userData.id
      }
    }

    let query = supabase.from("lists").select(`
      *,
      owner:users(farcaster_username, farcaster_display_name, farcaster_pfp_url),
      places:list_places(
        id,
        place:places(*)
      )
    `)

    // Apply filters
    if (dbUserId) {
      query = query.eq("owner_id", dbUserId)
    }

    if (visibility) {
      if (visibility === "public-community") {
        query = query.in("visibility", ["public", "community"])
      } else {
        query = query.eq("visibility", visibility)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching lists:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/lists - Create a new list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, visibility, ownerId, coverImageUrl } = body

    if (!title || !ownerId) {
      return NextResponse.json({ error: "Title and ownerId are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("lists")
      .insert({
        title,
        description,
        visibility: visibility || "private",
        owner_id: ownerId,
        cover_image_url: coverImageUrl,
      })
      .select()

    if (error) {
      console.error("Error creating list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in POST /api/lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
