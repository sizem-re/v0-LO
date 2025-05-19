import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { getUserFromRequest } from "@/lib/auth-utils"

// GET /api/lists/[id] - Get a specific list with its places
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // First, get the list
    const { data: list, error: listError } = await supabase.from("lists").select("*").eq("id", id).single()

    if (listError) {
      if (listError.code === "PGRST116") {
        return NextResponse.json({ error: "List not found" }, { status: 404 })
      }
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    // Check if user has access to this list
    if (list.user_id !== user.id && list.privacy !== "public") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get places in this list
    const { data: placesData, error: placesError } = await supabase
      .from("places_lists")
      .select(`
        place:places(*)
      `)
      .eq("list_id", id)

    if (placesError) {
      return NextResponse.json({ error: placesError.message }, { status: 500 })
    }

    // Extract places from the join table results
    const places = placesData.map((item) => item.place)

    return NextResponse.json({
      ...list,
      places,
      place_count: places.length,
    })
  } catch (error) {
    console.error("Error in GET /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/lists/[id] - Update a list
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Check if list exists and belongs to user
    const { data: existingList, error: checkError } = await supabase
      .from("lists")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "List not found or not owned by you" }, { status: 404 })
      }
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    const { title, description, privacy } = body

    const { data, error } = await supabase
      .from("lists")
      .update({
        title: title || existingList.title,
        description: description !== undefined ? description : existingList.description,
        privacy: privacy || existingList.privacy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/lists/[id] - Delete a list
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if list exists and belongs to user
    const { data: existingList, error: checkError } = await supabase
      .from("lists")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "List not found or not owned by you" }, { status: 404 })
      }
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // Delete the list
    const { error } = await supabase.from("lists").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/lists/[id]:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
