import { CheckCircle, Zap, FileImage } from "lucide-react"

interface CompressionStatusProps {
  originalSize: number
  compressedSize?: number
  compressionRatio?: number
  isCompressing?: boolean
}

export function CompressionStatus({ 
  originalSize, 
  compressedSize, 
  compressionRatio,
  isCompressing = false 
}: CompressionStatusProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
    return `${Math.round(bytes / (1024 * 1024))}MB`
  }

  if (isCompressing) {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
        <Zap className="h-3 w-3 animate-pulse" />
        <span>Compressing image...</span>
      </div>
    )
  }

  if (compressedSize && compressionRatio && compressionRatio > 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
        <CheckCircle className="h-3 w-3" />
        <span>
          Compressed {compressionRatio}% • {formatSize(originalSize)} → {formatSize(compressedSize)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1">
      <FileImage className="h-3 w-3" />
      <span>{formatSize(originalSize)}</span>
    </div>
  )
} 