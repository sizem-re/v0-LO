import { NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY!,
})
const neynarClient = new NeynarAPIClient(config)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { trustedData } = body
    
    if (!trustedData?.messageBytes) {
      return new Response("Invalid frame data", { status: 400 })
    }

    // Verify the frame action with Neynar
    const frameValidation = await neynarClient.validateFrameAction(trustedData.messageBytes)
    
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
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("farcaster_id", fid.toString())
      .maybeSingle()

    if (findError && findError.code !== "PGRST116") {
      console.error("Error checking for existing user:", findError)
      return new Response("Database error", { status: 500 })
    }

    let dbUser
    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          farcaster_username: user.username,
          farcaster_display_name: user.display_name,
          farcaster_pfp_url: user.pfp_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating user:", updateError)
        return new Response("Database error", { status: 500 })
      }
      dbUser = updatedUser
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          id: uuidv4(),
          farcaster_id: fid.toString(),
          farcaster_username: user.username,
          farcaster_display_name: user.display_name,
          farcaster_pfp_url: user.pfp_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating user:", createError)
        return new Response("Database error", { status: 500 })
      }
      dbUser = newUser
    }

    // Return a Frame response that redirects to the app with auth token
    const authToken = Buffer.from(JSON.stringify({ 
      userId: dbUser.id, 
      fid: fid.toString(),
      timestamp: Date.now() 
    })).toString('base64')

    // Return Frame HTML that redirects to the app
    const frameHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://llllllo.com/og-image.png" />
          <meta property="fc:frame:button:1" content="Open LO App" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="https://llllllo.com?auth=${authToken}" />
        </head>
        <body>
          <p>Authentication successful! Click the button to open LO.</p>
        </body>
      </html>
    `

    return new Response(frameHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Frame auth error:", error)
    return new Response("Internal server error", { status: 500 })
  }
} 