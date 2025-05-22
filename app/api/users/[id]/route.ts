import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // First try to get user by UUID (our internal ID)
    let { data: user, error } = await supabase
      .from("users")
      .select(
        "id, username, display_name, avatar_url, fid, farcaster_username, farcaster_display_name, farcaster_pfp_url",
      )
      .eq("id", userId)
      .single()

    // If not found by UUID, try by farcaster_id (FID)
    if (error && error.code === "PGRST116") {
      const { data: userByFid, error: fidError } = await supabase
        .from("users")
        .select(
          "id, username, display_name, avatar_url, fid, farcaster_username, farcaster_display_name, farcaster_pfp_url",
        )
        .eq("farcaster_id", userId)
        .single()

      if (!fidError && userByFid) {
        user = userByFid
        error = null
      }
    }

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user with consistent field names
    const responseUser = {
      id: user.id,
      username: user.username || user.farcaster_username,
      display_name: user.display_name || user.farcaster_display_name,
      avatar_url: user.avatar_url || user.farcaster_pfp_url,
      fid: user.fid,
    }

    return NextResponse.json(responseUser)
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
