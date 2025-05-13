"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function FarcasterCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the FID from the URL parameters
        const fid = searchParams.get("fid")

        if (!fid) {
          throw new Error("No FID received from Farcaster")
        }

        // Send message to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "farcaster:auth:success",
              fid: Number.parseInt(fid, 10),
            },
            window.location.origin,
          )

          setStatus("success")

          // Close the popup after a short delay
          setTimeout(() => {
            window.close()
          }, 1000)
        } else {
          // If no opener, store in localStorage and redirect
          localStorage.setItem("farcaster_fid", fid)
          window.location.href = "/"
        }
      } catch (error) {
        console.error("Callback error:", error)
        setStatus("error")
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {status === "loading" && (
        <div>
          <p className="text-center mb-4">Completing authentication...</p>
          <div className="w-8 h-8 border-t-2 border-black rounded-full animate-spin mx-auto"></div>
        </div>
      )}

      {status === "success" && (
        <div className="text-center">
          <p className="mb-4">Successfully authenticated!</p>
          <p className="text-sm text-black/60">This window will close automatically.</p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication failed. Please try again.</p>
          <button onClick={() => window.close()} className="lo-button">
            Close
          </button>
        </div>
      )}
    </div>
  )
}
