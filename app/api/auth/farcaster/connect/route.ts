import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { domain, siweUri } = await req.json()
    
    // Create a channel with the official Farcaster Connect relay
    // Based on FIP-11, the correct endpoint is connect.farcaster.xyz/v1/channel
    const response = await fetch('https://connect.farcaster.xyz/v1/channel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        siweUri: siweUri || `https://${domain}`,
        domain: domain,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Farcaster Connect error:', response.status, errorText)
      throw new Error(`Failed to create channel: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log('Farcaster Connect response:', data)
    
    // The response should contain channelToken and url
    // We need to construct the connect URI for mobile
    const connectUri = `https://warpcast.com/~/sign-in-with-farcaster?channelToken=${data.channelToken}`
    
    return NextResponse.json({
      channelToken: data.channelToken,
      url: data.url,
      connectUri,
    })
  } catch (error) {
    console.error('Error creating Farcaster Connect channel:', error)
    return NextResponse.json(
      { error: 'Failed to create authentication channel' },
      { status: 500 }
    )
  }
} 