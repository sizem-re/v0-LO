import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { uploadPlaceImage, validateImageFile, compressImage } from '@/lib/supabase-storage'

export async function POST(request: NextRequest) {
  try {
    // Get place ID from query params instead of dynamic route
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get('placeId')
    
    console.log('=== IMAGE UPLOAD API DEBUG ===')
    console.log('Place ID received:', placeId)
    
    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })
    }
    
    // Get the form data
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      console.log('No file provided in form data')
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Validate the image file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.log('File validation failed:', validation.error)
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    console.log('File validation passed')

    // Verify the place exists - with better error logging
    console.log('Looking up place in database...')
    const { data: place, error: placeError } = await supabaseAdmin
      .from('places')
      .select('id, image_url')
      .eq('id', placeId)
      .single()

    console.log('Database lookup result:', {
      place: place,
      error: placeError,
      errorCode: placeError?.code,
      errorMessage: placeError?.message
    })

    if (placeError) {
      console.error('Database error when looking up place:', placeError)
      return NextResponse.json({ 
        error: 'Place not found', 
        details: placeError.message,
        placeId: placeId 
      }, { status: 404 })
    }

    if (!place) {
      console.log('No place found with ID:', placeId)
      return NextResponse.json({ 
        error: 'Place not found',
        placeId: placeId 
      }, { status: 404 })
    }

    console.log('Place found:', place)

    // Compress the image if it's large
    const processedFile = file.size > 1024 * 1024 ? await compressImage(file) : file
    console.log('File processed, size:', processedFile.size)

    // Upload the image
    console.log('Uploading image to storage...')
    const imageUrl = await uploadPlaceImage(processedFile, placeId)
    
    if (!imageUrl) {
      console.log('Image upload failed')
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    console.log('Image uploaded successfully:', imageUrl)

    // Update the place with the new image URL
    console.log('Updating place with image URL...')
    const { data: updatedPlace, error: updateError } = await supabaseAdmin
      .from('places')
      .update({ 
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', placeId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating place with image URL:', updateError)
      return NextResponse.json({ error: 'Failed to update place' }, { status: 500 })
    }

    console.log('Place updated successfully:', updatedPlace)
    console.log('=== IMAGE UPLOAD SUCCESS ===')

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      place: updatedPlace
    })

  } catch (error) {
    console.error('Error in image upload:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 