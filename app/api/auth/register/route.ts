import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { farcaster_id, farcaster_username, farcaster_display_name, farcaster_pfp_url } = body

    if (!farcaster_id) {
      return NextResponse.json({ error: "Farcaster ID is required" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("farcaster_id", farcaster_id)
      .single()

    if (findError && findError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected if the user doesn't exist
      console.error("Error checking for existing user:", findError)
      return NextResponse.json({ error: "Failed to check for existing user" }, { status: 500 })
    }

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          farcaster_username,
          farcaster_display_name,
          farcaster_pfp_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()

      if (error) {
        console.error("Error updating user:", error)
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
      }

      return NextResponse.json(data[0])
    } else {
      // Create new user
      const { data, error } = await supabaseAdmin
        .from("users")
        .insert({
          id: uuidv4(),
          farcaster_id,
          farcaster_username,
          farcaster_display_name,
          farcaster_pfp_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        console.error("Error creating user:", error)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      return NextResponse.json(data[0])
    }
  } catch (error) {
    console.error("Error in POST /api/auth/register:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
