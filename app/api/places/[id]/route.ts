import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"

// GET /api/places/[id] - Get a specific place
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data, error } = await supabase.from("places").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/places/[id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

// PATCH /api/places/[id] - Update a place
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { id } = params
    const updates = await request.json()

    // Validate required fields
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 })
    }

    // Only allow specific fields to be updated
    const allowedFields = ["name", "address", "lat", "lng", "website"]
    const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => allowedFields.includes(key)))

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("places").update(filteredUpdates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PATCH /api/places/[id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

// DELETE /api/places/[id] - Delete a place
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { id } = params

    // First, delete all list_places entries for this place
    const { error: listPlacesError } = await supabase.from("list_places").delete().eq("place_id", id)

    if (listPlacesError) {
      console.error("Error deleting list_places entries:", listPlacesError)
      return NextResponse.json({ error: listPlacesError.message }, { status: 500 })
    }

    // Then delete the place itself
    const { error } = await supabase.from("places").delete().eq("id", id)

    if (error) {
      console.error("Error deleting place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Place deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/places/[id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
