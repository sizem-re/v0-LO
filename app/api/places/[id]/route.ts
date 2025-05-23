import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

// GET /api/places/[id] - Get a specific place
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log(`Fetching place: ${id}`)

    const { data, error } = await supabase.from("places").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("Error fetching place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      console.log(`Place not found: ${id}`)
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    console.log(`Successfully fetched place: ${data.name}`)
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
    const { id } = params
    const updates = await request.json()

    console.log("PATCH /api/places/[id] - Received updates:", updates)

    // Validate required fields
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 })
    }

    // First, get the current place to check available columns
    const { data: existingPlace, error: checkError } = await supabase
      .from("places")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking place existence:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (!existingPlace) {
      console.log(`Place not found for update: ${id}`)
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    // Determine which columns actually exist in the database
    const existingColumns = Object.keys(existingPlace)
    console.log("Existing columns in places table:", existingColumns)

    // Only allow updates to fields that actually exist in the database
    const allowedFields = ["name", "address", "lat", "lng"]

    // Check if website column exists before adding it to allowed fields
    if (existingColumns.includes("website")) {
      allowedFields.push("website")
    } else {
      console.log("WARNING: 'website' column does not exist in places table")
      // If updates contains website but the column doesn't exist, log it
      if (updates.website) {
        console.log(`Cannot update website field (${updates.website}) as column does not exist`)
      }
    }

    const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => allowedFields.includes(key)))

    console.log("PATCH /api/places/[id] - Filtered updates:", filteredUpdates)

    // Add updated_at timestamp if it exists in the schema
    if (existingColumns.includes("updated_at")) {
      filteredUpdates.updated_at = new Date().toISOString()
    }

    // If there are no valid updates after filtering, return success without updating
    if (Object.keys(filteredUpdates).length === 0) {
      console.log("No valid fields to update after filtering")
      return NextResponse.json({
        message: "No changes made - some fields may not exist in the database schema",
        data: existingPlace,
      })
    }

    const { data, error } = await supabase.from("places").update(filteredUpdates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("PATCH /api/places/[id] - Updated place:", data.name)
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
    const { id } = params

    console.log(`Deleting place: ${id}`)

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

    console.log(`Successfully deleted place: ${id}`)
    return NextResponse.json({ success: true, message: "Place deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/places/[id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
