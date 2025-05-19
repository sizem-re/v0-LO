import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { getUserFromRequest } from "@/lib/auth-utils"

// GET /api/places/[id] - Get a specific place with its lists
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const { data: place, error: placeError } = await supabase
      .from("places")
      .select(`
        *,
        lists:places_lists(
          list:lists(*)
        )
      `)
      .eq("id", id)
      .single()

    if (placeError) {
      if (placeError.code === "PGRST116") {
        return NextResponse.json({ error: "Place not found" }, { status: 404 })
      }
      return NextResponse.json({ error: placeError.message }, { status: 500 })
    }

    // Transform data to include list information
    const lists = place.lists.map((l: any) => l.list).filter(Boolean)

    return NextResponse.json({
      ...place,
      lists,
    })
  } catch (error) {
    console.error("Error in GET /api/places/[id]:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/places/[id] - Update a place
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Check if place exists and belongs to user
    const { data: existingPlace, error: checkError } = await supabase
      .from("places")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "Place not found or not owned by you" }, { status: 404 })
      }
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    const { name, address, description, type, website, lat, lng, image_url } = body

    const { data, error } = await supabase
      .from("places")
      .update({
        name: name || existingPlace.name,
        address: address || existingPlace.address,
        description: description !== undefined ? description : existingPlace.description,
        type: type !== undefined ? type : existingPlace.type,
        website: website !== undefined ? website : existingPlace.website,
        lat: lat || existingPlace.lat,
        lng: lng || existingPlace.lng,
        image_url: image_url !== undefined ? image_url : existingPlace.image_url,
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
    console.error("Error in PUT /api/places/[id]:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/places/[id] - Delete a place
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if place exists and belongs to user
    const { data: existingPlace, error: checkError } = await supabase
      .from("places")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "Place not found or not owned by you" }, { status: 404 })
      }
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // Delete the place
    const { error } = await supabase.from("places").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/places/[id]:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
