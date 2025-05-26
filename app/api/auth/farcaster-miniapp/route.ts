import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// JWT verification function (simplified - in production you'd use a proper JWT library)
function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    return payload
  } catch (error) {
    throw new Error('Failed to decode JWT')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Decode the JWT (in production, you should verify the signature)
    let payload
    try {
      payload = decodeJWT(token)
    } catch (error) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
    }

    const { sub: fid, address, exp } = payload

    // Check if token is expired
    if (Date.now() / 1000 > exp) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }

    if (!fid) {
      return NextResponse.json({ error: "Invalid token: missing FID" }, { status: 400 })
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
    
    if (existingUser) {
      // Update existing user
      userId = existingUser.id as string
      
      await supabaseAdmin
        .from("users")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    } else {
      // Create new user
      const newUserId = uuidv4()
      userId = newUserId
      
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: newUserId,
          farcaster_id: fid.toString(),
          farcaster_username: "", // We'll need to fetch this separately if needed
          farcaster_display_name: "",
          farcaster_pfp_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error("Error creating user:", insertError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }
    }

    // Return user data for client-side authentication
    return NextResponse.json({ 
      success: true, 
      user: {
        id: userId,
        farcaster_id: fid.toString(),
        address: address || null,
      }
    })
  } catch (error) {
    console.error("Miniapp auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 