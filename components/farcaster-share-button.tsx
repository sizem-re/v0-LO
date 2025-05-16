"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { useFarcasterSDK } from "@/lib/farcaster-sdk-context"

interface FarcasterShareButtonProps {
  title: string
  text: string
  url?: string
}

export function FarcasterShareButton({ title, text, url }: FarcasterShareButtonProps) {
  const { sdk, isMiniApp } = useFarcasterSDK()
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  const handleShare = async () => {
    try {
      setIsSharing(true)

      // Create the cast text
      const castText = `${title}\n\n${text}${url ? `\n\n${url}` : ""}`

      if (isMiniApp && sdk) {
        // Use the SDK to compose a cast if in a Mini App
        await sdk.actions.composeCast({
          text: castText,
          embeds: url ? [url] : [],
        })
      } else {
        // Open Warpcast compose window if not in a Mini App
        window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`, "_blank")
      }

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

      {shareSuccess && <p className="text-green-600 mt-2">Shared successfully!</p>}
    </div>
  )
}
