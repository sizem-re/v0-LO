import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Decode the auth token
    let decodedToken
    try {
      decodedToken = JSON.parse(Buffer.from(token, 'base64').toString())
    } catch (error) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
    }

    const { userId, fid, timestamp } = decodedToken

    // Check if token is not too old (24 hours)
    const tokenAge = Date.now() - timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (tokenAge > maxAge) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }

    // Verify user exists in database
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .eq("farcaster_id", fid)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 })
    }

    // Return user data for client-side authentication
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        farcaster_id: user.farcaster_id,
        farcaster_username: user.farcaster_username,
        farcaster_display_name: user.farcaster_display_name,
        farcaster_pfp_url: user.farcaster_pfp_url,
      }
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 