import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from("places").select("*").eq("id", placeId).single()

    if (error) {
      console.error("Error fetching place:", error)
      return NextResponse.json({ error: "Failed to fetch place" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/places/[id]:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    // First delete all list_places entries for this place
    const { error: listPlacesError } = await supabaseAdmin.from("list_places").delete().eq("place_id", placeId)

    if (listPlacesError) {
      console.error("Error deleting list_places entries:", listPlacesError)
      return NextResponse.json({ error: "Failed to delete place from lists" }, { status: 500 })
    }

    // Then delete the place
    const { error } = await supabaseAdmin.from("places").delete().eq("id", placeId)

    if (error) {
      console.error("Error deleting place:", error)
      return NextResponse.json({ error: "Failed to delete place" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/places/[id]:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from("places")
      .update({
        name: body.name,
        description: body.description,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
        type: body.type,
        website_url: body.website_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", placeId)
      .select()
      .single()

    if (error) {
      console.error("Error updating place:", error)
      return NextResponse.json({ error: "Failed to update place" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PATCH /api/places/[id]:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
