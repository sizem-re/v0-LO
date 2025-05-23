import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data, error } = await supabaseAdmin.from("places").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching place ${id}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error in GET /api/places/${params.id}:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    // Extract fields that might be updated
    const { name, address, lat, lng, type, description, website_url } = body

    // Log the update attempt
    console.log(`Updating place ${id}:`, {
      name,
      address,
      lat,
      lng,
      type,
      description,
      website_url,
    })

    // Build the update object with only provided fields
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (lat !== undefined) updateData.lat = lat.toString()
    if (lng !== undefined) updateData.lng = lng.toString()
    if (type !== undefined) updateData.type = type
    if (description !== undefined) updateData.description = description
    if (website_url !== undefined) updateData.website_url = website_url

    // Update the place
    const { data, error } = await supabaseAdmin.from("places").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error(`Error updating place ${id}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Place ${id} updated successfully:`, data)
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error in PATCH /api/places/${params.id}:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
