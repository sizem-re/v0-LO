import { NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk"
import { createClient } from "@farcaster/quick-auth"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// Initialize Neynar client
const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY!,
})
const neynarClient = new NeynarAPIClient(config)

// Initialize Farcaster Quick Auth client
const quickAuthClient = createClient()

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    
    console.log("Received miniapp auth request with token:", token ? "present" : "missing")
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Get the domain from the request headers or environment
    const host = req.headers.get('host') || 'localhost:3000'
    // Use production domain if available, otherwise use host
    const domain = host.includes('localhost') ? 'localhost' : 'llllllo.com'
    
    console.log("Verifying JWT with domain:", domain)

    // Verify the JWT using the official Farcaster Quick Auth client
    let payload
    try {
      payload = await quickAuthClient.verifyJwt({ token, domain })
      console.log("Verified JWT payload:", JSON.stringify(payload, null, 2))
    } catch (error) {
      console.error("JWT verification error:", error)
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const { sub: fid, address } = payload
    console.log("Extracted from JWT - FID:", fid, "Address:", address)

    if (!fid) {
      console.error("No FID found in token payload")
      return NextResponse.json({ error: "Invalid token: missing FID" }, { status: 400 })
    }

    console.log("Fetching user profile for FID:", fid)

    // Get user details from Neynar
    let neynarUser
    try {
      const { users } = await neynarClient.fetchBulkUsers({ fids: [Number(fid)] })
      neynarUser = users[0]
      
      console.log("Neynar user data:", neynarUser ? {
        fid: neynarUser.fid,
        username: neynarUser.username,
        display_name: neynarUser.display_name
      } : "null")
      
      if (!neynarUser) {
        return NextResponse.json({ error: "User not found on Farcaster" }, { status: 404 })
      }
    } catch (error) {
      console.error("Error fetching user from Neynar:", error)
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    // Check if user exists in database
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("farcaster_id", fid.toString())
      .maybeSingle()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking for existing user:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    let userId = ""
    let userData
    
    if (existingUser) {
      // Update existing user with latest profile data
      userId = existingUser.id as string
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          farcaster_username: neynarUser.username,
          farcaster_display_name: neynarUser.display_name,
          farcaster_pfp_url: neynarUser.pfp_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating user:", updateError)
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
      }

      userData = updatedUser
    } else {
      // Create new user with Neynar profile data
      const newUserId = uuidv4()
      userId = newUserId
      
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: newUserId,
          farcaster_id: fid.toString(),
          farcaster_username: neynarUser.username,
          farcaster_display_name: neynarUser.display_name,
          farcaster_pfp_url: neynarUser.pfp_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating user:", insertError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      userData = newUser
    }

    // Return user data for client-side authentication
    return NextResponse.json({ 
      success: true, 
      user: {
        id: userData.id,
        farcaster_id: userData.farcaster_id,
        farcaster_username: userData.farcaster_username,
        farcaster_display_name: userData.farcaster_display_name,
        farcaster_pfp_url: userData.farcaster_pfp_url,
        address: address || null,
      }
    })
  } catch (error) {
    console.error("Miniapp auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 