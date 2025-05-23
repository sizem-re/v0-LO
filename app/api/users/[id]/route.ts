import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Fetching user with ID: ${userId}`)

    // First try to get user by UUID (our internal ID)
    let { data: user, error } = await supabase
      .from("users")
      .select(
        "id, username, display_name, avatar_url, fid, farcaster_username, farcaster_display_name, farcaster_pfp_url",
      )
      .eq("id", userId)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors when no record found

    // If not found by UUID, try by farcaster_id (FID)
    if (!user && !error) {
      console.log(`User not found by UUID, trying FID: ${userId}`)
      const { data: userByFid, error: fidError } = await supabase
        .from("users")
        .select(
          "id, username, display_name, avatar_url, fid, farcaster_username, farcaster_display_name, farcaster_pfp_url",
        )
        .eq("fid", userId)
        .maybeSingle()

      if (!fidError && userByFid) {
        user = userByFid
        error = null
      }
    }

    // If still no user found, try by farcaster_username
    if (!user && !error) {
      console.log(`User not found by FID, trying username: ${userId}`)
      const { data: userByUsername, error: usernameError } = await supabase
        .from("users")
        .select(
          "id, username, display_name, avatar_url, fid, farcaster_username, farcaster_display_name, farcaster_pfp_url",
        )
        .or(`username.eq.${userId},farcaster_username.eq.${userId}`)
        .maybeSingle()

      if (!usernameError && userByUsername) {
        user = userByUsername
        error = null
      }
    }

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    if (!user) {
      console.log(`User not found: ${userId}`)
      // Return a fallback user object instead of 404
      return NextResponse.json({
        id: userId,
        username: "unknown",
        display_name: "Unknown User",
        avatar_url: null,
        fid: null,
      })
    }

    // Return user with consistent field names
    const responseUser = {
      id: user.id,
      username: user.username || user.farcaster_username || "unknown",
      display_name: user.display_name || user.farcaster_display_name || "Unknown User",
      avatar_url: user.avatar_url || user.farcaster_pfp_url,
      fid: user.fid,
    }

    console.log(`Successfully fetched user: ${responseUser.display_name}`)
    return NextResponse.json(responseUser)
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
