"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear all authentication data
    try {
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear any cookies by setting them to expire
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      })
      
      console.log("All authentication data cleared")
    } catch (error) {
      console.error("Error clearing data:", error)
    }
  }, [])

  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">👋</div>
        <h1 className="text-2xl font-bold text-gray-900">Logged Out Successfully</h1>
        <p className="text-gray-600 max-w-md">
          All authentication data has been cleared from your browser.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleGoHome}
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            Return to Home
          </button>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p><strong>If you're still seeing login issues:</strong></p>
            <ol className="text-left space-y-1">
              <li>1. Close all browser tabs</li>
              <li>2. Clear browser cache</li>
              <li>3. Restart your browser</li>
              <li>4. Try again</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
} 