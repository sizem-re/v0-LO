"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function FarcasterAuth() {
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    setIsConnecting(true)

    // This is a placeholder for the actual Farcaster authentication
    // You'll need to implement the actual Farcaster auth flow
    setTimeout(() => {
      setIsConnecting(false)
      toast({
        title: "Authentication Demo",
        description: "In the real app, this would connect to Farcaster.",
      })
    }, 1500)
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-black text-white hover:bg-gray-800 rounded-none border border-black"
    >
      {isConnecting ? "CONNECTING..." : "CONNECT FARCASTER"}
    </Button>
  )
}
