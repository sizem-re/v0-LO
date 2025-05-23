import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase-client"

// Cache for user data to reduce duplicate lookups
const userCache = new Map<string, any>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Helper function to create user from FID using Neynar
async function createUserFromFid(fid: string) {
  try {
    console.log(`Creating user from FID: ${fid}`)

    // Check cache first
    const cacheKey = `fid:${fid}`
    const cached = userCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached user for FID: ${fid}`)
      return cached.data
    }

    // Use the correct Neynar API endpoint and format
    const neynarResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        api_key: process.env.NEYNAR_API_KEY || "",
        "Content-Type": "application/json",
      },
    })

    if (!neynarResponse.ok) {
      console.error(`Neynar API error: ${neynarResponse.status} ${neynarResponse.statusText}`)
      const errorText = await neynarResponse.text()
      console.error(`Neynar error response:`, errorText)
      return null
    }

    const neynarData = await neynarResponse.json()
    console.log(`Neynar API response:`, neynarData)

    const userData = neynarData.users?.[0]

    if (!userData) {
      console.error(`No user data found for FID ${fid}`)
      return null
    }

    console.log(`Found Neynar user data:`, userData)

    // Create user in Supabase using the correct field mapping
    const newUser = {
      id: crypto.randomUUID(),
      farcaster_id: fid,
      farcaster_username: userData.username || "",
      farcaster_display_name: userData.display_name || userData.username || "",
      farcaster_pfp_url: userData.pfp_url || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log(`Creating user in Supabase:`, newUser)

    const { data: createdUser, error } = await supabaseAdmin.from("users").insert(newUser).select().single()

    if (error) {
      console.error("Error creating user in Supabase:", error)
      return null
    }

    console.log(`Created user in Supabase:`, createdUser)

    // Add to cache
    userCache.set(cacheKey, { data: createdUser, timestamp: Date.now() })
    userCache.set(`id:${createdUser.id}`, { data: createdUser, timestamp: Date.now() })

    return createdUser
  } catch (error) {
    console.error("Error in createUserFromFid:", error)
    return null
  }
}

// Helper function to find user by ID with multiple search strategies
async function findUserById(userId: string) {
  console.log(`Searching for user with ID: ${userId}`)

  // Check cache first
  const cacheKey = `id:${userId}`
  const cached = userCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached user for ID: ${userId}`)
    return cached.data
  }

  // Try multiple search strategies
  const searchStrategies = [
    // Search by UUID
    () => supabase.from("users").select("*").eq("id", userId).maybeSingle(),
    // Search by farcaster_id as string
    () => supabase.from("users").select("*").eq("farcaster_id", userId).maybeSingle(),
    // Search by farcaster_username
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

        // Add to cache
        userCache.set(cacheKey, { data: user, timestamp: Date.now() })
        if (user.farcaster_id) {
          userCache.set(`fid:${user.farcaster_id}`, { data: user, timestamp: Date.now() })
        }

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
    const timestamp = Date.now()
    console.log(`GET /api/users/${userId} (${timestamp})`)

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
        farcaster_username: "unknown",
        farcaster_display_name: "Unknown User",
        farcaster_pfp_url: "",
        farcaster_id: userId,
      })
    }

    // Normalize the response format
    const responseUser = {
      id: user.id,
      farcaster_username: user.farcaster_username || "unknown",
      farcaster_display_name: user.farcaster_display_name || user.farcaster_username || "Unknown User",
      farcaster_pfp_url: user.farcaster_pfp_url || "",
      farcaster_id: user.farcaster_id,
    }

    console.log(`Returning user data:`, responseUser)
    return NextResponse.json(responseUser)
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
