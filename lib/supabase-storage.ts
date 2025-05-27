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

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get public URL
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
    const bucketIndex = pathParts.indexOf(STORAGE_BUCKET)
    
    if (bucketIndex === -1) {
      console.error('Invalid image URL format')
      return false
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // Delete file from storage
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

// Helper function to validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, or WebP)' }
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be smaller than 5MB' }
  }

  return { valid: true }
}

// Helper function to compress image if needed
export function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      const newWidth = img.width * ratio
      const newHeight = img.height * ratio

      // Set canvas dimensions
      canvas.width = newWidth
      canvas.height = newHeight

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(compressedFile)
        } else {
          resolve(file) // Return original if compression fails
        }
      }, file.type, quality)
    }

    img.src = URL.createObjectURL(file)
  })
} 