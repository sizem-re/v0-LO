/**
 * Client-side image compression utilities
 * These functions use browser APIs and should only be called in the browser
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * Compress an image file on the client-side
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    maxSizeKB = 500
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        )

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress the image
        ctx?.drawImage(img, 0, 0, width, height)

        // Try different quality levels if size is too large
        let currentQuality = quality
        let compressedFile: File

        const tryCompress = (q: number): Promise<File> => {
          return new Promise((resolveCompress) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'))
                  return
                }
                
                const compressed = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                })
                
                resolveCompress(compressed)
              },
              file.type,
              q
            )
          })
        }

        // Start with the specified quality
        tryCompress(currentQuality).then(async (compressed) => {
          compressedFile = compressed

          // If still too large and quality can be reduced, try lower quality
          if (compressed.size > maxSizeKB * 1024 && currentQuality > 0.3) {
            currentQuality = Math.max(0.3, currentQuality - 0.2)
            compressedFile = await tryCompress(currentQuality)
          }

          const result: CompressionResult = {
            file: compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100)
          }

          resolve(result)
        })
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight

  // If image is larger than max dimensions, scale it down
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height

    if (width > height) {
      width = maxWidth
      height = width / aspectRatio
    } else {
      height = maxHeight
      width = height * aspectRatio
    }
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * Check if compression is needed based on file size and dimensions
 */
export function shouldCompress(file: File, maxSizeKB: number = 500): boolean {
  return file.size > maxSizeKB * 1024
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
      URL.revokeObjectURL(img.src)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = URL.createObjectURL(file)
  })
} 