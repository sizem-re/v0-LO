"use client"

import { ChevronLeft } from "lucide-react"
import { FarcasterAuth } from "@/components/farcaster-auth"

interface LoginViewProps {
  onBack: () => void
  onLoginSuccess: () => void
}

export function LoginView({ onBack, onLoginSuccess }: LoginViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="text-center py-8">
          <h2 className="font-serif text-xl mb-6">Connect with Farcaster</h2>

          <p className="mb-8 text-black/70">
            Connect with your Farcaster account to create and save lists of your favorite places.
          </p>

          <div className="flex justify-center mb-8">
            <FarcasterAuth />
          </div>

          <p className="text-sm text-black/60">
            Don't have a Farcaster account?{" "}
            <a href="https://www.farcaster.xyz/" target="_blank" rel="noopener noreferrer" className="underline">
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
