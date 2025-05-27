import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { uploadPlaceImage, validateImageFile, compressImage } from '@/lib/supabase-storage'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: placeId } = await params
    
    // Get the form data
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate the image file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Verify the place exists
    const { data: place, error: placeError } = await supabaseAdmin
      .from('places')
      .select('id, image_url')
      .eq('id', placeId)
      .single()

    if (placeError || !place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    // Compress the image if it's large
    const processedFile = file.size > 1024 * 1024 ? await compressImage(file) : file

    // Upload the image
    const imageUrl = await uploadPlaceImage(processedFile, placeId)
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Update the place with the new image URL
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