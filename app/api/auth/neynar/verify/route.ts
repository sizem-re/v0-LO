import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { code, state } = await req.json()
    
    if (!process.env.NEYNAR_API_KEY) {
      throw new Error('NEYNAR_API_KEY is not configured')
    }
    
    if (!process.env.NEYNAR_CLIENT_ID) {
      throw new Error('NEYNAR_CLIENT_ID is not configured')
    }
    
    if (!process.env.NEYNAR_CLIENT_SECRET) {
      throw new Error('NEYNAR_CLIENT_SECRET is not configured')
    }
    
    if (!code) {
      throw new Error('Authorization code is required')
    }
    
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://api.neynar.com/v2/farcaster/login/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEYNAR_API_KEY,
      },
      body: JSON.stringify({
        client_id: process.env.NEYNAR_CLIENT_ID,
        client_secret: process.env.NEYNAR_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://llllllo.com'}/auth/neynar/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Neynar token exchange error:', tokenResponse.status, errorText)
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    
    // Get user information using the access token
    const userResponse = await fetch('https://api.neynar.com/v2/farcaster/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'x-api-key': process.env.NEYNAR_API_KEY,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('Neynar user fetch error:', userResponse.status, errorText)
      throw new Error(`Failed to fetch user data: ${userResponse.status}`)
    }

    const userData = await userResponse.json()
    
    // Extract user information from Neynar response
    const user = userData.user || userData
    const authData = {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text || user.bio,
      custodyAddress: user.custody_address,
      verifications: user.verifications || [],
      followerCount: user.follower_count,
      followingCount: user.following_count,
      // Store the authentication data
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      signerUuid: tokenData.signer_uuid,
      authenticatedAt: new Date().toISOString(),
    }
    
    return NextResponse.json(authData)
  } catch (error) {
    console.error('Error verifying Neynar authentication:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify authentication' },
      { status: 500 }
    )
  }
} 