import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { uploadPlaceImage, validateImageFile } from '@/lib/supabase-storage'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: placeId } = await params
    
    console.log('=== IMAGE UPLOAD API DEBUG ===')
    console.log('Place ID received:', placeId)
    
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

    // Upload the image
    console.log('Uploading image to storage...')
    const imageUrl = await uploadPlaceImage(file, placeId)
    
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

    // TODO: Delete old image if it exists
    // if (place.image_url) {
    //   await deletePlaceImage(place.image_url)
    // }

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      place: updatedPlace
    })

  } catch (error) {
    console.error('Error in image upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: placeId } = await params

    // Get the current place
    const { data: place, error: placeError } = await supabaseAdmin
      .from('places')
      .select('id, image_url')
      .eq('id', placeId)
      .single()

    if (placeError || !place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    if (!place.image_url) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 400 })
    }

    // Remove image URL from database
    const { error: updateError } = await supabaseAdmin
      .from('places')
      .update({ 
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', placeId)

    if (updateError) {
      console.error('Error removing image URL from place:', updateError)
      return NextResponse.json({ error: 'Failed to update place' }, { status: 500 })
    }

    // TODO: Delete the actual file from storage
    // await deletePlaceImage(place.image_url)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in image deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 