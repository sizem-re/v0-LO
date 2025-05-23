import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 })
    }

    console.log(`Debug: Fetching Neynar user data for FID: ${fid}`)

    // Test the Neynar API directly
    const neynarResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        api_key: process.env.NEYNAR_API_KEY || "",
        "Content-Type": "application/json",
      },
    })

    console.log(`Neynar API status: ${neynarResponse.status}`)

    if (!neynarResponse.ok) {
      const errorText = await neynarResponse.text()
      console.error(`Neynar API error:`, errorText)
      return NextResponse.json(
        {
          error: `Neynar API error: ${neynarResponse.status}`,
          details: errorText,
        },
        { status: neynarResponse.status },
      )
    }

    const neynarData = await neynarResponse.json()
    console.log(`Neynar API response:`, JSON.stringify(neynarData, null, 2))

    return NextResponse.json({
      success: true,
      neynarResponse: neynarData,
      userData: neynarData.users?.[0] || null,
      apiKey: process.env.NEYNAR_API_KEY ? "Present" : "Missing",
    })
  } catch (error) {
    console.error("Error in debug Neynar user:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
