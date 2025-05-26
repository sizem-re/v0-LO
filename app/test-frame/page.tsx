"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext, NeynarAuthButton } from "@neynar/react"

export default function TestFramePage() {
  const { isAuthenticated, user, dbUser } = useAuth()
  const [testingMode, setTestingMode] = useState("frame")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Check for auth token in URL
  const checkAuthToken = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('auth')
    
    if (authToken) {
      try {
        const response = await fetch(`/api/debug/frame-auth?token=${authToken}`)
        const data = await response.json()
        setDebugInfo(data)
      } catch (error) {
        setDebugInfo({ error: "Failed to decode token" })
      }
    } else {
      setDebugInfo({ message: "No auth token found in URL" })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Frame Authentication Test</h1>
        
        {isAuthenticated ? (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="text-green-800 font-bold">✓ Authentication Successful!</p>
            <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
              {JSON.stringify({ user, dbUser }, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-md mb-4">
            <p className="text-yellow-800">Not authenticated. Try the methods below:</p>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button 
            className={`px-3 py-1 text-sm rounded ${testingMode === 'frame' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTestingMode('frame')}
          >
            Frame Auth
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded ${testingMode === 'direct' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTestingMode('direct')}
          >
            Direct Auth
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded ${testingMode === 'debug' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => { 
              setTestingMode('debug')
              checkAuthToken()
            }}
          >
            Debug
          </button>
        </div>

        {testingMode === 'frame' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              This page can be used to test Frame authentication. When shared in Warpcast, 
              users should be able to authenticate by clicking the "Login with Farcaster" button in the Frame.
            </p>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>How to test:</strong>
                <br />
                1. Share this URL in Warpcast
                <br />
                2. Click the "Login with Farcaster" button in the Frame
                <br />
                3. You should be automatically authenticated and redirected to the main app
              </p>
            </div>
            <div className="border p-4 rounded-md">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
                <img src="/og-image.png" alt="Frame Preview" className="max-h-40 object-contain" />
              </div>
              <div className="mt-2 flex">
                <button className="w-full py-2 bg-blue-500 text-white rounded">
                  Login with Farcaster
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Frame preview (not functional)</p>
            </div>
          </div>
        )}

        {testingMode === 'direct' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Test direct login using the Neynar authentication button:
            </p>
            <div className="flex justify-center">
              <NeynarAuthButton className="py-2 px-4 bg-purple-600 text-white rounded" />
            </div>
          </div>
        )}

        {testingMode === 'debug' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Debug information:
            </p>
            <div className="bg-gray-100 p-4 rounded-md">
              <pre className="text-xs overflow-auto">
                {debugInfo ? JSON.stringify(debugInfo, null, 2) : "Loading debug info..."}
              </pre>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Testing URLs:</p>
              <a 
                href="/api/debug/frame-auth?token=eyJ1c2VySWQiOiJ0ZXN0IiwiZmlkIjoiMTIzIiwidGltZXN0YW1wIjoxNjM3MDkzOTIyfQ=="
                target="_blank" 
                className="block text-sm text-blue-600"
              >
                Test Token Decoding
              </a>
              <button
                onClick={checkAuthToken}
                className="text-sm bg-gray-200 px-3 py-1 rounded"
              >
                Check Current URL for Auth Token
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 