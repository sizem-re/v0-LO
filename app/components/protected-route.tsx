"use client"

import { useAuth } from "../lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!isAuthenticated) {
    return null // Will redirect in the useEffect
  }

  return <>{children}</>
} 