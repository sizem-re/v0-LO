import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { getUserFromRequest } from "@/lib/auth-utils"

// GET /api/lists - Get all lists for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const includePublic = url.searchParams.get("includePublic") === "true"

    let query = supabase.from("lists").select(`
        *,
        places:places_lists(
          place:places(*)
        )
      `)

    if (includePublic) {
      query = query.or(`user_id.eq.${user.id},privacy.eq.public`)
    } else {
      query = query.eq("user_id", user.id)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching lists:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to include place_count
    const transformedData = data.map((list) => {
      const places = list.places.map((p: any) => p.place)
      return {
        ...list,
        places,
        place_count: places.length,
      }
    })

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error in GET /api/lists:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/lists - Create a new list
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { title, description, privacy } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("lists")
      .insert({
        title,
        description,
        privacy: privacy || "private",
        user_id: user.id,
        fid: user.fid || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/lists:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
