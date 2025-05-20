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
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="p-4 flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-medium mb-6">Connect with Farcaster</h2>
          <p className="text-center text-black/70 mb-8">
            Sign in with your Farcaster account to create and save lists.
          </p>
          <div onClick={onLoginSuccess}>
            <FarcasterAuth />
          </div>
        </div>
      </div>
    </div>
  )
}
