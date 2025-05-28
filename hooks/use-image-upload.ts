import { useState, useCallback } from 'react'
import { validateImageFile } from '@/lib/supabase-storage'
import { compressImage, shouldCompress, type CompressionOptions } from '@/lib/image-compression'

interface UseImageUploadOptions {
  onSuccess?: (imageUrl: string) => void
  onError?: (error: string) => void
  onCompressionProgress?: (progress: { stage: string; originalSize: number; compressedSize?: number }) => void
  compression?: CompressionOptions
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
    onCompressionProgress,
    compression = {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      maxSizeKB: 500
    }
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

      setUploadProgress(10)

      // Check if compression is needed
      let processedFile = file
      if (shouldCompress(file, compression.maxSizeKB)) {
        onCompressionProgress?.({ 
          stage: 'Compressing image...', 
          originalSize: file.size 
        })
        
        setUploadProgress(25)

        try {
          const compressionResult = await compressImage(file, compression)
          processedFile = compressionResult.file
          
          onCompressionProgress?.({ 
            stage: `Compressed ${compressionResult.compressionRatio}%`, 
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize
          })
          
          console.log('Image compression result:', {
            originalSize: `${Math.round(compressionResult.originalSize / 1024)}KB`,
            compressedSize: `${Math.round(compressionResult.compressedSize / 1024)}KB`,
            compressionRatio: `${compressionResult.compressionRatio}%`
          })
        } catch (compressionError) {
          console.warn('Compression failed, uploading original:', compressionError)
          // Continue with original file if compression fails
        }
      } else {
        onCompressionProgress?.({ 
          stage: 'No compression needed', 
          originalSize: file.size 
        })
      }

      setUploadProgress(50)

      // Create form data
      const formData = new FormData()
      formData.append('image', processedFile)

      setUploadProgress(75)

      // Upload to API with fallback endpoints
      let uploadResponse = await fetch(`/api/places/${placeId}/upload-image`, {
        method: 'POST',
        body: formData,
      })

      // If 404, try the alternative endpoint
      if (uploadResponse.status === 404) {
        console.log("Original endpoint not found, trying alternative...")
        uploadResponse = await fetch(`/api/upload-place-image?placeId=${placeId}`, {
          method: 'POST',
          body: formData,
        })
      }

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await uploadResponse.json()
      setUploadProgress(100)

      onSuccess?.(result.imageUrl)
      return result.imageUrl

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      onError?.(errorMessage)
      return null
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000) // Reset progress after 1 second
    }
  }, [validateFile, onSuccess, onError, onCompressionProgress, compression])

  return {
    isUploading,
    uploadProgress,
    uploadImage,
    validateFile
  }
} 