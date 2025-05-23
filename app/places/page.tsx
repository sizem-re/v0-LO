"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function PlacesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page - we're using the sidebar for navigation
    router.replace("/")
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Redirecting to home page...</p>
      </div>
    </div>
  )
}
