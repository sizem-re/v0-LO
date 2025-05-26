import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { redirect_uri, app_redirect, timeout } = await req.json()
    
    // For now, we'll return the standard Neynar auth URL
    // In a production app, you might want to customize this based on the options
    const authUrl = `https://app.neynar.com/login?client_id=${process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect_uri || window.location.origin)}`
    
    return NextResponse.json({ 
      authUrl,
      options: {
        redirect_uri,
        app_redirect,
        timeout
      }
    })
  } catch (error) {
    console.error("Auth init error:", error)
    return NextResponse.json({ error: "Failed to initialize auth" }, { status: 500 })
  }
} 