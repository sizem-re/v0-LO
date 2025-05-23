import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const { fid } = await request.json()

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 })
    }

    console.log(`Creating user from FID: ${fid}`)

    // Fetch user data from Neynar
    const neynarResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        api_key: process.env.NEYNAR_API_KEY || "",
        "Content-Type": "application/json",
      },
    })

    if (!neynarResponse.ok) {
      return NextResponse.json(
        {
          error: `Neynar API error: ${neynarResponse.status}`,
          details: await neynarResponse.text(),
        },
        { status: 500 },
      )
    }

    const neynarData = await neynarResponse.json()
    const userData = neynarData.users?.[0]

    if (!userData) {
      return NextResponse.json(
        {
          error: `No user data found for FID ${fid}`,
          neynarResponse: neynarData,
        },
        { status: 404 },
      )
    }

    // Create user in Supabase
    const newUser = {
      id: uuidv4(),
      farcaster_id: fid.toString(),
      farcaster_username: userData.username || "",
      farcaster_display_name: userData.display_name || userData.username || "",
      farcaster_pfp_url: userData.pfp_url || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: createdUser, error } = await supabaseAdmin.from("users").insert(newUser).select().single()

    if (error) {
      return NextResponse.json(
        {
          error: "Error creating user in Supabase",
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      neynarData: userData,
      createdUser,
    })
  } catch (error) {
    console.error("Error in POST /api/debug/create-user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
