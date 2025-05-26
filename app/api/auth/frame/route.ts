import { NextRequest } from "next/server"
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// Define the user type for better type safety
interface DbUser {
  id: string;
  farcaster_id: string;
  farcaster_username?: string;
  farcaster_display_name?: string;
  farcaster_pfp_url?: string;
  created_at: string;
  updated_at: string;
}

// Define a specific type for the frame response
interface FrameRedirectResponse {
  location: string;
}

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY!,
})
const neynarClient = new NeynarAPIClient(config)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { trustedData } = body
    
    console.log("Received Frame request:", { 
      messageBytes: trustedData?.messageBytes?.slice(0, 32) + "..." // Log first 32 chars only
    })
    
    if (!trustedData?.messageBytes) {
      return new Response("Invalid frame data", { status: 400 })
    }

    // Verify the frame action with Neynar
    console.log("Validating Frame action with Neynar...")
    const frameValidation = await neynarClient.validateFrameAction({
      messageBytesInHex: trustedData.messageBytes
    })
    
    console.log("Frame validation result:", {
      success: !!frameValidation?.action?.interactor,
      fid: frameValidation?.action?.interactor?.fid
    })
    
    if (!frameValidation?.action?.interactor) {
      return new Response("Invalid frame signature", { status: 401 })
    }

    const fid = frameValidation.action.interactor.fid
    
    // Get user details from Neynar
    const { users } = await neynarClient.fetchBulkUsers({ fids: [fid] })
    const user = users[0]
    
    if (!user) {
      return new Response("User not found", { status: 404 })
    }

    // Check if user exists in your database
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("farcaster_id", fid.toString())
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking for existing user:", error)
      return new Response("Database error", { status: 500 })
    }

    let userId = ""
    
    if (data) {
      // Update existing user
      userId = data.id as string
      
      await supabaseAdmin
        .from("users")
        .update({
          farcaster_username: user.username,
          farcaster_display_name: user.display_name,
          farcaster_pfp_url: user.pfp_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    } else {
      // Create new user
      const newUserId = uuidv4()
      userId = newUserId
      
      await supabaseAdmin
        .from("users")
        .insert({
          id: newUserId,
          farcaster_id: fid.toString(),
          farcaster_username: user.username,
          farcaster_display_name: user.display_name,
          farcaster_pfp_url: user.pfp_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
    }

    // Return a Frame response that redirects to the app with auth token
    const authToken = Buffer.from(JSON.stringify({ 
      userId, 
      fid: fid.toString(),
      timestamp: Date.now() 
    })).toString('base64')

    // Redirect URL with auth token
    const redirectUrl = `https://llllllo.com?auth=${authToken}`

    // Return redirect frame response (specific format required by Farcaster)
    return new Response(
      JSON.stringify({
        version: "vNext",
        image: "https://llllllo.com/og-image.png",
        redirect: redirectUrl
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error("Frame auth error:", error)
    return new Response("Internal server error", { status: 500 })
  }
} 