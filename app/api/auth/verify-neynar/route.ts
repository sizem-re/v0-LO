import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const authData = await req.json()
    
    const { fid, username, displayName, pfpUrl, signerUuid } = authData
    
    if (!fid || !signerUuid) {
      return NextResponse.json(
        { error: 'Missing required fields: fid and signerUuid are required' },
        { status: 400 }
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
        const errorText = await response.text()
        console.error('Registration failed:', errorText)
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
    console.error('Error verifying Neynar authentication:', error)
    return NextResponse.json(
      { error: 'Authentication verification failed' },
      { status: 500 }
    )
  }
} 