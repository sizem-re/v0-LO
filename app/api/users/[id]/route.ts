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
      fid: Number.parseInt(fid), // Store as integer
      farcaster_id: fid, // Keep as string for compatibility
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

// Helper function to find user by ID with multiple search strategies
async function findUserById(userId: string) {
  console.log(`Searching for user with ID: ${userId}`)

  // Try multiple search strategies
  const searchStrategies = [
    // Search by UUID
    () => supabase.from("users").select("*").eq("id", userId).maybeSingle(),
    // Search by farcaster_id as string
    () => supabase.from("users").select("*").eq("farcaster_id", userId).maybeSingle(),
    // Search by fid as integer (if userId is numeric)
    () =>
      /^\d+$/.test(userId)
        ? supabase.from("users").select("*").eq("fid", Number.parseInt(userId)).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    // Search by username
    () => supabase.from("users").select("*").eq("farcaster_username", userId).maybeSingle(),
  ]

  for (const [index, strategy] of searchStrategies.entries()) {
    try {
      const { data: user, error } = await strategy()
      if (error) {
        console.log(`Search strategy ${index + 1} failed:`, error.message)
        continue
      }
      if (user) {
        console.log(`Found user with strategy ${index + 1}:`, user)
        return user
      }
    } catch (error) {
      console.log(`Search strategy ${index + 1} threw error:`, error)
      continue
    }
  }

  console.log(`No user found with any strategy for ID: ${userId}`)
  return null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    console.log(`GET /api/users/${userId}`)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Use improved user search
    let user = await findUserById(userId)

    // If still not found and it looks like an FID, try to create from Neynar
    if (!user && /^\d+$/.test(userId)) {
      console.log(`Attempting to create user from FID: ${userId}`)
      user = await createUserFromFid(userId)
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

    // Normalize the response format
    const responseUser = {
      id: user.id,
      farcaster_username: user.farcaster_username || "Unknown User",
      farcaster_display_name: user.farcaster_display_name || user.farcaster_username || "Unknown User",
      farcaster_pfp_url: user.farcaster_pfp_url || "",
      farcaster_id: user.farcaster_id || user.fid?.toString(),
      fid: user.fid,
    }

    console.log(`Returning user data:`, responseUser)
    return NextResponse.json(responseUser)
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
