import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelToken = searchParams.get('channelToken')
    
    if (!channelToken) {
      return NextResponse.json(
        { error: 'Channel token is required' },
        { status: 400 }
      )
    }
    
    // Poll the official Farcaster Connect relay for status
    const response = await fetch(`https://relay.farcaster.xyz/v1/channel/status?channelToken=${channelToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`)
    }

    const data = await response.json()
    
    // The response should contain state, and if completed, the signature and user data
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting Farcaster Connect status:', error)
    return NextResponse.json(
      { error: 'Failed to get authentication status' },
      { status: 500 }
    )
  }
} 