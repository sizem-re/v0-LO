"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

export function AuthDebug() {
  const [supabaseStatus, setSupabaseStatus] = useState<string>("Checking...")
  const [errors, setErrors] = useState<string[]>([])
  const [neynarStatus, setNeynarStatus] = useState<{
    isAuthenticated: boolean
    user: any | null
  }>({ isAuthenticated: false, user: null })

  const { isAuthenticated: authContextAuthenticated } = useAuth()

  // Check Neynar context safely
  useEffect(() => {
    try {
      // Dynamically import to avoid SSR issues
      import("@neynar/react")
        .then(({ useNeynarContext }) => {
          try {
            // This is not a proper use of hooks, but we're just checking if it's available
            const neynarContext = (window as any).__NEYNAR_CONTEXT__
            if (neynarContext) {
              setNeynarStatus({
                isAuthenticated: neynarContext.isAuthenticated || false,
                user: neynarContext.user || null,
              })
            } else {
              setErrors((prev) => [...prev, "Neynar context not found in window"])
            }
          } catch (error) {
            setErrors((prev) => [
              ...prev,
              `Neynar context error: ${error instanceof Error ? error.message : String(error)}`,
            ])
          }
        })
        .catch((error) => {
          setErrors((prev) => [
            ...prev,
            `Neynar import error: ${error instanceof Error ? error.message : String(error)}`,
          ])
        })
    } catch (error) {
      setErrors((prev) => [...prev, `Neynar check error: ${error instanceof Error ? error.message : String(error)}`])
    }
  }, [])

  useEffect(() => {
    // Check Supabase connection
    const checkSupabase = async () => {
      try {
        const { supabase } = await import("@/lib/supabase-client")
        const { data, error } = await supabase.from("users").select("count").limit(1)

        if (error) {
          setSupabaseStatus(`Error: ${error.message}`)
          setErrors((prev) => [...prev, `Supabase error: ${error.message}`])
        } else {
          setSupabaseStatus("Connected successfully")
        }
      } catch (error) {
        setSupabaseStatus(`Connection failed: ${error instanceof Error ? error.message : String(error)}`)
        setErrors((prev) => [
          ...prev,
          `Supabase connection error: ${error instanceof Error ? error.message : String(error)}`,
        ])
      }
    }

    checkSupabase()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50 text-xs">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="mb-2">
        <div>
          <strong>Auth Context:</strong> {authContextAuthenticated ? "Authenticated" : "Not authenticated"}
        </div>
        <div>
          <strong>Neynar Context:</strong> {neynarStatus.isAuthenticated ? "Authenticated" : "Not authenticated"}
        </div>
        <div>
          <strong>Supabase:</strong> {supabaseStatus}
        </div>
        {neynarStatus.user && (
          <div className="mt-2">
            <strong>Neynar User:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
              {JSON.stringify(neynarStatus.user, null, 2)}
            </pre>
          </div>
        )}
      </div>
      {errors.length > 0 && (
        <div>
          <strong className="text-red-500">Errors:</strong>
          <ul className="list-disc pl-4 mt-1 text-red-500">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
