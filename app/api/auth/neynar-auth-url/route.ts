import { NextRequest, NextResponse } from 'next/server'
import neynarClient from '@/lib/neynar-client-instance'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isMobile = searchParams.get('mobile') === 'true'
    
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Neynar client ID not configured' },
        { status: 500 }
      )
    }
    
    // Use different redirect URLs for mobile vs desktop
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://llllllo.com'
    const redirectUri = isMobile 
      ? `${baseUrl}/` // Redirect directly to home page on mobile
      : `${baseUrl}/auth/callback` // Use callback page for desktop popup
    
    console.log('Generating auth URL for:', { isMobile, redirectUri, clientId })
    
    // Use Neynar's official API to generate the authorization URL
    const response = await neynarClient.fetchAuthorizationUrl({
      clientId,
      responseType: 'code'
    })
    
    console.log('Neynar auth URL response:', response)
    
    // Manually add the redirect_uri to the returned URL
    const authUrl = new URL(response.authorization_url)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'read write')
    
    return NextResponse.json({
      authUrl: authUrl.toString(),
      redirectUri,
      isMobile
    })
    
  } catch (error) {
    console.error('Error generating Neynar auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
} 