import { supabase, supabaseAdmin } from './supabase-client'

// Storage bucket configuration
export const STORAGE_BUCKET = 'place-images'

// Helper function to upload image to Supabase Storage
export async function uploadPlaceImage(file: File, placeId: string): Promise<string | null> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${placeId}-${Date.now()}.${fileExt}`
    const filePath = `places/${fileName}`

    // Upload file to Supabase Storage using admin client to bypass RLS
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get public URL using regular client (public URLs don't need admin access)
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadPlaceImage:', error)
    return null
  }
}

// Helper function to delete image from Supabase Storage
export async function deletePlaceImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const filePath = pathParts.slice(pathParts.indexOf('places')).join('/')

    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deletePlaceImage:', error)
    return false
  }
}

// Validation function for image files
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a JPEG, PNG, or WebP image file.'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image file size must be less than 5MB.'
    }
  }

  return { valid: true }
}

// Note: For image compression, use the client-side utilities in @/lib/image-compression
// Those functions use browser APIs and should only be called in the browser, not in API routes. 