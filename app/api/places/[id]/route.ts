import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

// GET /api/places/[id] - Get a specific place
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log(`Fetching place: ${id} (type: ${typeof id})`)

    // Try both string and number formats for the ID
    const query = supabaseAdmin.from("places").select(`
      *,
      users!created_by(
        id,
        farcaster_id,
        farcaster_username,
        farcaster_display_name,
        farcaster_pfp_url
      )
    `)

    // First try as string
    let { data, error } = await query.eq("id", id).maybeSingle()

    // If no result and id looks like a number, try as number
    if (!data && !error && /^\d+$/.test(id)) {
      console.log(`Trying ID as number: ${Number(id)}`)
      const result = await supabaseAdmin
        .from("places")
        .select(`
          *,
          users!created_by(
            id,
            farcaster_id,
            farcaster_username,
            farcaster_display_name,
            farcaster_pfp_url
          )
        `)
        .eq("id", Number(id))
        .maybeSingle()
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

    // Transform the data to include creator information
    const transformedData = {
      ...data,
      creator: data.users || null,
    }

    console.log(`Successfully fetched place: ${transformedData.name}`, transformedData)
    return NextResponse.json(transformedData)
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
    const stringResult = await supabaseAdmin.from("places").select("*").eq("id", id).maybeSingle()

    if (stringResult.data) {
      existingPlace = stringResult.data
    } else if (!stringResult.error && /^\d+$/.test(id)) {
      // Try as number if it looks like a number
      console.log(`Trying ID as number for existence check: ${Number(id)}`)
      const numberResult = await supabaseAdmin.from("places").select("*").eq("id", Number(id)).maybeSingle()
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

    // Try using supabaseAdmin instead of supabase for the update
    const { data, error } = await supabaseAdmin.from("places").update(filteredUpdates).eq("id", actualId).select()

    if (error) {
      console.error("Supabase update error:", error)

      // If there's an error, try a different approach - direct SQL
      console.log("Trying direct SQL update as fallback...")

      // Build the SET clause for the SQL query
      const setClauses = Object.entries(filteredUpdates)
        .map(([key, value]) => {
          if (value === null) {
            return `${key} = NULL`
          } else if (typeof value === "string") {
            return `${key} = '${value.replace(/'/g, "''")}'`
          } else {
            return `${key} = ${value}`
          }
        })
        .join(", ")

      const sqlQuery = `
        UPDATE places 
        SET ${setClauses}
        WHERE id = '${actualId}'
        RETURNING *;
      `

      console.log("Executing SQL:", sqlQuery)

      const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc("execute_sql", {
        sql_query: sqlQuery,
      })

      if (sqlError) {
        console.error("SQL update error:", sqlError)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log("SQL update result:", sqlData)

      // Fetch the updated place
      const { data: updatedPlace, error: fetchError } = await supabaseAdmin
        .from("places")
        .select("*")
        .eq("id", actualId)
        .maybeSingle()

      if (fetchError || !updatedPlace) {
        console.error("Error fetching updated place:", fetchError)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log("Successfully updated place via SQL:", updatedPlace)
      return NextResponse.json(updatedPlace)
    }

    if (!data || data.length === 0) {
      console.error("No rows were updated - this shouldn't happen!")
      console.log("Attempting to fetch the place again to see current state...")

      const { data: currentPlace } = await supabaseAdmin.from("places").select("*").eq("id", actualId).maybeSingle()

      if (currentPlace) {
        console.log("Current place state:", currentPlace)
        console.log("Returning current place state as fallback")
        return NextResponse.json(currentPlace)
      }

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
    const { data: existingPlace } = await supabaseAdmin.from("places").select("id").eq("id", id).maybeSingle()

    if (!existingPlace && /^\d+$/.test(id)) {
      const { data: numberPlace } = await supabaseAdmin.from("places").select("id").eq("id", Number(id)).maybeSingle()
      if (numberPlace) {
        actualId = numberPlace.id
      }
    } else if (existingPlace) {
      actualId = existingPlace.id
    }

    // First, delete all list_places entries for this place
    const { error: listPlacesError } = await supabaseAdmin.from("list_places").delete().eq("place_id", actualId)

    if (listPlacesError) {
      console.error("Error deleting list_places entries:", listPlacesError)
      return NextResponse.json({ error: listPlacesError.message }, { status: 500 })
    }

    // Then delete the place itself
    const { error } = await supabaseAdmin.from("places").delete().eq("id", actualId)

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
