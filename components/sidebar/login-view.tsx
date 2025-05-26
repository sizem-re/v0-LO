"use client"

import { ChevronLeft } from "lucide-react"
import { FarcasterConnect } from "@/components/farcaster-connect"

interface LoginViewProps {
  onBack: () => void
  onLoginSuccess: () => void
}

export function LoginView({ onBack, onLoginSuccess }: LoginViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-black/10 px-4 py-3">
        <button onClick={onBack} className="p-1 mr-2 hover:bg-gray-100 rounded-full" aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-serif text-lg">Connect</h2>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h3 className="font-serif text-xl mb-2">Welcome to LO</h3>
          <p className="text-black/70">Connect with Farcaster to create lists and save places</p>
        </div>

        <FarcasterConnect 
          className="bg-black text-white hover:bg-black/80 px-6 py-3 rounded-md"
          onSuccess={onLoginSuccess}
        >
          Connect with Farcaster
        </FarcasterConnect>
      </div>
    </div>
  )
}
