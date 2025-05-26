import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { domain, siweUri } = await req.json()
    
    if (!process.env.NEYNAR_API_KEY) {
      throw new Error('NEYNAR_API_KEY is not configured')
    }
    
    if (!process.env.NEYNAR_CLIENT_ID) {
      throw new Error('NEYNAR_CLIENT_ID is not configured')
    }
    
    // Create SIWN authorization URL using Neynar's API
    const response = await fetch('https://api.neynar.com/v2/farcaster/login/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEYNAR_API_KEY,
      },
      body: JSON.stringify({
        client_id: process.env.NEYNAR_CLIENT_ID,
        response_type: 'code',
        redirect_uri: `${siweUri || 'https://llllllo.com'}/auth/neynar/callback`,
        scope: 'read write',
        state: Math.random().toString(36).substring(2, 15),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Neynar SIWN error:', response.status, errorText)
      throw new Error(`Failed to create SIWN URL: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      url: data.authorization_url || data.url,
      state: data.state,
    })
  } catch (error) {
    console.error('Error creating SIWN URL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create authentication URL' },
      { status: 500 }
    )
  }
} 