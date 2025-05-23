import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET() {
  try {
    console.log("Starting place creator migration...")

    // Get all places that don't have a creator
    const { data: places, error: placesError } = await supabaseAdmin
      .from("places")
      .select("id, list_places(added_by)")
      .is("created_by", null)

    if (placesError) {
      console.error("Error fetching places:", placesError)
      return NextResponse.json({ error: placesError.message }, { status: 500 })
    }

    console.log(`Found ${places?.length || 0} places without creators`)

    // Update each place with the creator from list_places
    const updates = []
    for (const place of places || []) {
      if (place.list_places && place.list_places.length > 0) {
        const addedBy = place.list_places[0].added_by

        if (addedBy) {
          console.log(`Updating place ${place.id} with creator ${addedBy}`)

          const { data, error } = await supabaseAdmin
            .from("places")
            .update({ created_by: addedBy })
            .eq("id", place.id)
            .select()

          if (error) {
            console.error(`Error updating place ${place.id}:`, error)
            updates.push({ id: place.id, success: false, error: error.message })
          } else {
            updates.push({ id: place.id, success: true, creator: addedBy })
          }
        }
      }
    }

    return NextResponse.json({
      message: `Migration completed. Updated ${updates.filter((u) => u.success).length} places.`,
      updates,
    })
  } catch (error) {
    console.error("Error in place creator migration:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
