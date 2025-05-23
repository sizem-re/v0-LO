import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { userId, fid } = await request.json()

    if (!userId || !fid) {
      return NextResponse.json({ error: "userId and fid are required" }, { status: 400 })
    }

    console.log(`Fixing user ${userId} with FID ${fid}`)

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

    // Update user in Supabase with correct Farcaster data
    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update({
        farcaster_id: fid.toString(),
        farcaster_username: userData.username || "",
        farcaster_display_name: userData.display_name || userData.username || "",
        farcaster_pfp_url: userData.pfp_url || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: "Error updating user in Supabase",
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      neynarData: userData,
      updatedUser,
    })
  } catch (error) {
    console.error("Error in fix-user endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
} 