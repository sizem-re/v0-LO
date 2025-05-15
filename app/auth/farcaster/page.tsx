"use client"

import { useEffect, useState } from "react"

export default function FarcasterAuthPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Redirect to Warpcast for authentication
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/farcaster/callback`)
        window.location.href = `https://warpcast.com/~/auth?redirect_uri=${redirectUri}`
      } catch (error) {
        console.error("Auth error:", error)
        setStatus("error")
        setErrorMessage("Failed to authenticate with Farcaster")
      }
    }

    handleAuth()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {status === "loading" && (
        <div>
          <p className="text-center mb-4">Connecting to Farcaster...</p>
          <div className="w-8 h-8 border-t-2 border-black rounded-full animate-spin mx-auto"></div>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button onClick={() => window.close()} className="lo-button">
            Close
          </button>
        </div>
      )}
    </div>
  )
}
