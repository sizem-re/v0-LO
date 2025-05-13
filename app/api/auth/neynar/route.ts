import { type NextRequest, NextResponse } from "next/server"
import * as neynarClient from "../../../lib/neynar-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")

    if (action === "signer") {
      // Create a new signer
      const response = await neynarClient.createSigner()
      return NextResponse.json(response)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Neynar API error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, signerUuid, fid, deadline, signature } = body

    if (action === "cast") {
      // Post a cast using Neynar
      const response = await neynarClient.publishCast(signerUuid, body.text, {
        embeds: body.embeds || [],
        mentions: body.mentions || [],
        mentionsPositions: body.mentionsPositions || [],
      })
      return NextResponse.json(response)
    }

    if (action === "verify") {
      // Verify a signed message
      const response = await neynarClient.verifySignature({
        fid,
        message: body.message,
        signature,
        deadline,
      })
      return NextResponse.json(response)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Neynar API error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
