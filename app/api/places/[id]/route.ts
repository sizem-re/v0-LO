import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

// GET /api/places/[id] - Get a specific place
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log(`Fetching place: ${id} (type: ${typeof id})`)

    // Try both string and number formats for the ID
    const query = supabase.from("places").select("*")

    // First try as string
    let { data, error } = await query.eq("id", id).maybeSingle()

    // If no result and id looks like a number, try as number
    if (!data && !error && /^\d+$/.test(id)) {
      console.log(`Trying ID as number: ${Number(id)}`)
      const result = await supabase.from("places").select("*").eq("id", Number(id)).maybeSingle()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error("Error fetching place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      console.log(`Place not found: ${id}`)
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    console.log(`Successfully fetched place: ${data.name}`, data)
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

    console.log("=== PATCH /api/places/[id] DEBUG ===")
    console.log("Place ID:", id, "(type:", typeof id, ")")
    console.log("Raw updates received:", JSON.stringify(updates, null, 2))

    // Validate required fields
    if (!updates || Object.keys(updates).length === 0) {
      console.log("No update data provided")
      return NextResponse.json({ error: "No update data provided" }, { status: 400 })
    }

    // Check if place exists first - try both string and number formats
    let existingPlace = null
    let checkError = null

    // First try as string
    const stringResult = await supabase.from("places").select("*").eq("id", id).maybeSingle()

    if (stringResult.data) {
      existingPlace = stringResult.data
    } else if (!stringResult.error && /^\d+$/.test(id)) {
      // Try as number if it looks like a number
      console.log(`Trying ID as number for existence check: ${Number(id)}`)
      const numberResult = await supabase.from("places").select("*").eq("id", Number(id)).maybeSingle()
      existingPlace = numberResult.data
      checkError = numberResult.error
    } else {
      checkError = stringResult.error
    }

    if (checkError) {
      console.error("Error checking place existence:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (!existingPlace) {
      console.log(`Place not found for update: ${id}`)
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    console.log("Existing place data:", JSON.stringify(existingPlace, null, 2))
    console.log("Existing place ID type:", typeof existingPlace.id)

    // Use the same ID type as the existing place
    const actualId = existingPlace.id

    // Only allow specific fields to be updated
    const allowedFields = ["name", "address", "lat", "lng", "website_url"]
    const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => allowedFields.includes(key)))

    console.log("Filtered updates:", JSON.stringify(filteredUpdates, null, 2))

    // Check if there are any actual changes
    const hasChanges = Object.entries(filteredUpdates).some(([key, value]) => {
      const existingValue = existingPlace[key]
      const isChanged = existingValue !== value
      console.log(`Field ${key}: "${existingValue}" -> "${value}" (changed: ${isChanged})`)
      return isChanged
    })

    if (!hasChanges) {
      console.log("No changes detected, returning existing place")
      return NextResponse.json(existingPlace)
    }

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString()

    console.log("Final update payload:", JSON.stringify(filteredUpdates, null, 2))
    console.log("Using actual ID for update:", actualId, "(type:", typeof actualId, ")")

    // Perform the update using the actual ID from the database
    const { data, error } = await supabase.from("places").update(filteredUpdates).eq("id", actualId).select()

    if (error) {
      console.error("Supabase update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error("No rows were updated - this shouldn't happen!")
      console.log("Attempting to fetch the place again to see current state...")

      const { data: currentPlace } = await supabase.from("places").select("*").eq("id", actualId).maybeSingle()
      console.log("Current place state:", currentPlace)

      return NextResponse.json({ error: "No rows were updated" }, { status: 500 })
    }

    const updatedPlace = data[0]
    console.log("Successfully updated place:", JSON.stringify(updatedPlace, null, 2))
    console.log("=== END PATCH DEBUG ===")

    return NextResponse.json(updatedPlace)
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

    // Use the same ID resolution logic
    let actualId = id

    // Check if place exists and get the actual ID
    const { data: existingPlace } = await supabase.from("places").select("id").eq("id", id).maybeSingle()

    if (!existingPlace && /^\d+$/.test(id)) {
      const { data: numberPlace } = await supabase.from("places").select("id").eq("id", Number(id)).maybeSingle()
      if (numberPlace) {
        actualId = numberPlace.id
      }
    } else if (existingPlace) {
      actualId = existingPlace.id
    }

    // First, delete all list_places entries for this place
    const { error: listPlacesError } = await supabase.from("list_places").delete().eq("place_id", actualId)

    if (listPlacesError) {
      console.error("Error deleting list_places entries:", listPlacesError)
      return NextResponse.json({ error: listPlacesError.message }, { status: 500 })
    }

    // Then delete the place itself
    const { error } = await supabase.from("places").delete().eq("id", actualId)

    if (error) {
      console.error("Error deleting place:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Successfully deleted place: ${actualId}`)
    return NextResponse.json({ success: true, message: "Place deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/places/[id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
