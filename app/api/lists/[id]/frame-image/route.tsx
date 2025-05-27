import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // For now, return a simple JSON response to test the endpoint
    return new Response(JSON.stringify({ 
      success: true, 
      listId: id,
      message: "Frame image endpoint working" 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error generating frame image:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate frame image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
} 