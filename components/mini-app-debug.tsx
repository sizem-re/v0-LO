"use client"

import { useEffect } from "react"

import { useState } from "react"
import { useMiniApp } from "@/hooks/use-mini-app"

export function MiniAppDebug() {
  const { isMiniApp } = useMiniApp()
  const [isExpanded, setIsExpanded] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  // Override console.log to capture logs
  useEffect(() => {
    if (!isMiniApp) return

    const originalConsoleLog = console.log
    const originalConsoleError = console.error

    console.log = (...args) => {
      originalConsoleLog(...args)
      setLogs((prev) => [...prev, `LOG: ${args.map((arg) => JSON.stringify(arg)).join(" ")}`])
    }

    console.error = (...args) => {
      originalConsoleError(...args)
      setLogs((prev) => [...prev, `ERROR: ${args.map((arg) => JSON.stringify(arg)).join(" ")}`])
    }

    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
    }
  }, [isMiniApp])

  if (!isMiniApp) return null

  return (
    <div className="fixed bottom-16 right-0 z-50 max-w-sm bg-white border border-black/10 shadow-lg">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-2 text-xs text-left bg-black text-white">
        Mini App Debug {isExpanded ? "▼" : "▲"}
      </button>

      {isExpanded && (
        <div className="p-2 max-h-60 overflow-auto text-xs">
          <div className="mb-2">
            <strong>URL:</strong> {window.location.href}
          </div>
          <div className="mb-2">
            <strong>User Agent:</strong> {window.navigator.userAgent}
          </div>
          <div className="mb-2">
            <strong>Logs:</strong>
            <div className="mt-1 border border-black/10 p-1 bg-gray-50 max-h-32 overflow-auto">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-black/50">No logs yet</div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              try {
                import("@farcaster/frame-sdk")
                  .then(({ sdk }) => {
                    sdk.actions
                      .ready()
                      .then(() => {
                        console.log("Manual ready() call successful")
                      })
                      .catch((err) => {
                        console.error("Manual ready() call failed:", err)
                      })
                  })
                  .catch((err) => {
                    console.error("Manual SDK import failed:", err)
                  })
              } catch (err) {
                console.error("Error in manual ready attempt:", err)
              }
            }}
            className="w-full p-1 bg-black text-white text-xs mt-2"
          >
            Try Manual ready()
          </button>
        </div>
      )}
    </div>
  )
}
