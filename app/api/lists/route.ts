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

// Helper function to find user by FID with multiple search strategies
async function findUserByFid(fid: string) {
  console.log(`Searching for user with FID: ${fid}`)

  // Try multiple search strategies
  const searchStrategies = [
    // Search by farcaster_id as string
    () => supabase.from("users").select("*").eq("farcaster_id", fid).maybeSingle(),
    // Search by fid as integer
    () => supabase.from("users").select("*").eq("fid", Number.parseInt(fid)).maybeSingle(),
    // Search by farcaster_id as integer (in case it was stored as int)
    () => supabase.from("users").select("*").eq("farcaster_id", Number.parseInt(fid)).maybeSingle(),
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

  console.log(`No user found with any strategy for FID: ${fid}`)
  return null
}

// GET /api/lists - Get lists (with filtering options)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const visibility = searchParams.get("visibility")
    const fid = searchParams.get("fid")

    console.log("GET /api/lists - Query params:", { userId, visibility, fid })

    // If fid is provided, get the user's ID from Supabase
    let dbUserId = userId
    if (fid && !userId) {
      // Use improved user search
      const userData = await findUserByFid(fid)

      if (userData) {
        dbUserId = userData.id
        console.log(`Found user ID ${dbUserId} for fid ${fid}`)
      } else {
        console.log(`No user found for fid ${fid}, attempting to create...`)

        // Try to create the user from Neynar data
        const newUser = await createUserFromFid(fid)
        if (newUser) {
          dbUserId = newUser.id
          console.log(`Created new user with ID ${dbUserId} for fid ${fid}`)
        } else {
          console.log(`Failed to create user for fid ${fid}`)
        }
      }
    }

    let query = supabase.from("lists").select(`
      *,
      owner:users(id, farcaster_username, farcaster_display_name, farcaster_pfp_url),
      places:list_places(
        id,
        place:places(*)
      )
    `)

    // Apply filters
    if (dbUserId) {
      query = query.eq("owner_id", dbUserId)
      console.log(`Filtering lists by owner_id: ${dbUserId}`)
    }

    if (visibility) {
      if (visibility === "public-community") {
        query = query.in("visibility", ["public", "community"])
        console.log(`Filtering lists by visibility: public or community`)
      } else {
        query = query.eq("visibility", visibility)
        console.log(`Filtering lists by visibility: ${visibility}`)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching lists:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${data?.length || 0} lists`)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/lists - Create a new list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, visibility, ownerId, coverImageUrl } = body

    if (!title || !ownerId) {
      return NextResponse.json({ error: "Title and ownerId are required" }, { status: 400 })
    }

    // Generate a UUID for the new list
    const listId = uuidv4()

    // Use the admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("lists")
      .insert({
        id: listId,
        title,
        description,
        visibility: visibility || "private",
        owner_id: ownerId,
        cover_image_url: coverImageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error creating list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in POST /api/lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
