import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { redirect_uri, app_redirect, timeout } = await req.json()
    
    // Get the host from the request
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    
    // Use a proper callback URL that handles both mobile and desktop
    const callbackUrl = redirect_uri || `${baseUrl}/auth/callback`
    
    // Create the Neynar auth URL with proper redirect handling
    const authUrl = `https://app.neynar.com/login?client_id=${process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}`
    
    console.log("Generated auth URL:", authUrl)
    console.log("Callback URL:", callbackUrl)
    
    return NextResponse.json({ 
      authUrl,
      callbackUrl,
      options: {
        redirect_uri: callbackUrl,
        app_redirect,
        timeout
      }
    })
  } catch (error) {
    console.error("Auth init error:", error)
    return NextResponse.json({ error: "Failed to initialize auth" }, { status: 500 })
  }
} 