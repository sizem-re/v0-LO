import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Get all users (limited for debugging)
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select("id, farcaster_id, farcaster_username, farcaster_display_name")
      .limit(10)

    console.log("All users found:", allUsers)

    let specificUser = null
    let specificUserError = null

    if (userId) {
      // Try to find the specific user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      specificUser = userData
      specificUserError = userError

      console.log(`Looking for user ${userId}:`, userData, userError)

      // Also try with admin client
      const { data: adminUserData, error: adminUserError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      console.log(`Admin client result for ${userId}:`, adminUserData, adminUserError)
    }

    return NextResponse.json({
      allUsers,
      allUsersError: allUsersError?.message,
      specificUser,
      specificUserError: specificUserError?.message,
      searchedUserId: userId,
    })
  } catch (error) {
    console.error("Error in check-user endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
} 