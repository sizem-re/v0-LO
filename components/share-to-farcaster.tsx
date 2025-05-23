"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"
import { Share2 } from "lucide-react"

interface ShareToFarcasterProps {
  listId: string
  listTitle: string
  listDescription: string
}

export function ShareToFarcaster({ listId, listTitle, listDescription }: ShareToFarcasterProps) {
  const { isAuthenticated } = useAuth()
  const { isAuthenticated: neynarAuthenticated, user } = useNeynarContext()
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  const userIsAuthenticated = isAuthenticated || neynarAuthenticated

  if (!userIsAuthenticated) {
    return null
  }

  const handleShare = async () => {
    try {
      setIsSharing(true)

      // Create the cast text
      const castText = `Check out this list on LO: "${listTitle}"\n\n${listDescription.substring(0, 100)}${
        listDescription.length > 100 ? "..." : ""
      }\n\nhttps://lo-app.xyz/lists/${listId}`

      // Open Warpcast compose window
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`, "_blank")

      setShareSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setShareSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error sharing to Farcaster:", error)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div>
      <button onClick={handleShare} disabled={isSharing} className="lo-button flex items-center gap-2">
        <Share2 size={18} />
        {isSharing ? "Sharing..." : "Share"}
      </button>

      {shareSuccess && <p className="text-green-600 mt-2">Warpcast opened in a new tab!</p>}
    </div>
  )
}
