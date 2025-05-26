import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json({ 
      error: "No token provided",
      help: "Add ?token=YOUR_TOKEN to test token decoding"
    })
  }

  try {
    const decodedToken = JSON.parse(Buffer.from(token, 'base64').toString())
    const tokenAge = Date.now() - decodedToken.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    return NextResponse.json({
      success: true,
      decodedToken,
      tokenAge: `${Math.round(tokenAge / 1000 / 60)} minutes`,
      isExpired: tokenAge > maxAge,
      maxAge: "24 hours"
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to decode token",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    return NextResponse.json({
      received: body,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url,
      method: req.method
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to parse request",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
} 