import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// Helper function to create user from FID using Neynar
async function createUserFromFid(fid: string) {
  try {
    console.log(`Creating user from FID: ${fid}`)

    // Fetch user data from Neynar
    const neynarResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        api_key: process.env.NEYNAR_API_KEY || "",
        "Content-Type": "application/json",
      },
    })

    if (!neynarResponse.ok) {
      console.error(`Neynar API error: ${neynarResponse.status}`)
      return null
    }

    const neynarData = await neynarResponse.json()
    const userData = neynarData.users?.[0]

    if (!userData) {
      console.error(`No user data found for FID ${fid}`)
      return null
    }

    console.log(`Found Neynar user data:`, userData)

    // Create user in Supabase
    const newUser = {
      id: uuidv4(),
      farcaster_id: fid,
      farcaster_username: userData.username || "",
      farcaster_display_name: userData.display_name || userData.username || "",
      farcaster_pfp_url: userData.pfp_url || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: createdUser, error } = await supabaseAdmin.from("users").insert(newUser).select().single()

    if (error) {
      console.error("Error creating user in Supabase:", error)
      return null
    }

    console.log(`Created user in Supabase:`, createdUser)
    return createdUser
  } catch (error) {
    console.error("Error in createUserFromFid:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    console.log(`GET /api/users/${userId}`)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // First try to find user by ID
    let { data: user, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user by ID:", error)
    }

    // If not found by ID, try by farcaster_id (in case the ID is actually an FID)
    if (!user) {
      console.log(`User not found by ID, trying farcaster_id: ${userId}`)

      const { data: userByFid, error: fidError } = await supabase
        .from("users")
        .select("*")
        .eq("farcaster_id", userId)
        .maybeSingle()

      if (fidError) {
        console.error("Error fetching user by farcaster_id:", fidError)
      }

      if (userByFid) {
        user = userByFid
        console.log(`Found user by farcaster_id: ${user.id}`)
      } else {
        // Try to create user from Neynar if it looks like an FID (numeric)
        if (/^\d+$/.test(userId)) {
          console.log(`Attempting to create user from FID: ${userId}`)
          user = await createUserFromFid(userId)
        }
      }
    }

    if (!user) {
      console.log(`User not found and could not be created: ${userId}`)
      // Return a fallback user object instead of 404
      return NextResponse.json({
        id: userId,
        farcaster_username: "Unknown User",
        farcaster_display_name: "Unknown User",
        farcaster_pfp_url: "",
        farcaster_id: userId,
      })
    }

    console.log(`Returning user data:`, user)
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
