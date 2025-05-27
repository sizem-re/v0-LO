import { useState, useCallback } from 'react'
import { validateImageFile, compressImage } from '@/lib/supabase-storage'

interface UseImageUploadOptions {
  onSuccess?: (imageUrl: string) => void
  onError?: (error: string) => void
  autoCompress?: boolean
  maxWidth?: number
  quality?: number
}

interface UseImageUploadReturn {
  isUploading: boolean
  uploadProgress: number
  uploadImage: (file: File, placeId: string) => Promise<string | null>
  validateFile: (file: File) => { valid: boolean; error?: string }
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    onSuccess,
    onError,
    autoCompress = true,
    maxWidth = 1200,
    quality = 0.8
  } = options

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const validateFile = useCallback((file: File) => {
    return validateImageFile(file)
  }, [])

  const uploadImage = useCallback(async (file: File, placeId: string): Promise<string | null> => {
    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Validate the file
      const validation = validateFile(file)
      if (!validation.valid) {
        onError?.(validation.error || 'Invalid file')
        return null
      }

      setUploadProgress(25)

      // Compress the image if needed and enabled
      let processedFile = file
      if (autoCompress && file.size > 1024 * 1024) { // 1MB threshold
        processedFile = await compressImage(file, maxWidth, quality)
      }

      setUploadProgress(50)

      // Create form data
      const formData = new FormData()
      formData.append('image', processedFile)

      setUploadProgress(75)

      // Upload to API
      const response = await fetch(`/api/places/${placeId}/upload-image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadProgress(100)

      onSuccess?.(result.imageUrl)
      return result.imageUrl

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      onError?.(errorMessage)
      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [validateFile, onSuccess, onError, autoCompress, maxWidth, quality])

  return {
    isUploading,
    uploadProgress,
    uploadImage,
    validateFile
  }
} 