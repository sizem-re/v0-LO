import { NextRequest, NextResponse } from "next/server"
import { verifyMessage } from "viem"

export async function POST(req: NextRequest) {
  try {
    const { fid, username, displayName, pfpUrl, signature, message } = await req.json()
    
    if (!fid || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse the SIWE message to extract the address
    const addressMatch = message.match(/0x[a-fA-F0-9]{40}/)
    if (!addressMatch) {
      return NextResponse.json(
        { error: 'Invalid SIWE message format' },
        { status: 400 }
      )
    }
    
    const address = addressMatch[0] as `0x${string}`

    // Verify the signature
    try {
      const isValid = await verifyMessage({
        address,
        message,
        signature,
      })

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      )
    }

    // Create or update user in database
    try {
      const response = await fetch(`${req.nextUrl.origin}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farcaster_id: fid.toString(),
          farcaster_username: username || "",
          farcaster_display_name: displayName || "",
          farcaster_pfp_url: pfpUrl || "",
        }),
      })

      if (response.ok) {
        const userData = await response.json()
        return NextResponse.json({ user: userData })
      } else {
        throw new Error('Failed to register user')
      }
    } catch (error) {
      console.error("Error registering user:", error)
      return NextResponse.json(
        { error: 'Failed to register user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error verifying Farcaster authentication:', error)
    return NextResponse.json(
      { error: 'Authentication verification failed' },
      { status: 500 }
    )
  }
} 