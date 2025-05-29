import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface FarcasterProfileLinkProps {
  username?: string
  displayName?: string
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

/**
 * A clickable link component that opens a user's Farcaster profile on Warpcast
 */
export function FarcasterProfileLink({ 
  username, 
  displayName, 
  className, 
  showIcon = false,
  children 
}: FarcasterProfileLinkProps) {
  // If no username is provided, just render the display name without a link
  if (!username || username === 'unknown') {
    return (
      <span className={className}>
        {children || displayName || 'Unknown User'}
      </span>
    )
  }

  // Clean username (remove @ if present)
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username

  // Create Warpcast profile URL
  const profileUrl = `https://warpcast.com/${cleanUsername}`

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-blue-600 hover:text-blue-800 hover:underline transition-colors inline-flex items-center gap-1",
        className
      )}
      title={`View ${displayName || username}'s Farcaster profile`}
    >
      {children || displayName || username}
      {showIcon && <ExternalLink size={12} className="opacity-60" />}
    </a>
  )
} 