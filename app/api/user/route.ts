import { type NextRequest, NextResponse } from "next/server"
import * as neynarClient from "@/lib/neynar-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 })
    }

    // Fetch user data from Neynar
    const response = await neynarClient.lookupUserByFid(Number.parseInt(fid))

    return NextResponse.json(response.user)
  } catch (error) {
    console.error("Neynar API error:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
