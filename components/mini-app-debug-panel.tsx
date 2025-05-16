"use client"

import { useState, useEffect } from "react"
import { useMiniApp } from "@/hooks/use-mini-app"

export function MiniAppDebugPanel() {
  const { isMiniApp, detectionDetails } = useMiniApp()
  const [isExpanded, setIsExpanded] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [sdkStatus, setSdkStatus] = useState<"not_loaded" | "loading" | "loaded" | "error">("not_loaded")
  const [readyStatus, setReadyStatus] = useState<"not_called" | "success" | "error">("not_called")

  // Override console.log to capture logs
  useEffect(() => {
    const originalConsoleLog = console.log
    const originalConsoleError = console.error

    console.log = (...args) => {
      originalConsoleLog(...args)
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")

      setLogs((prev) => [...prev.slice(-19), `LOG: ${message}`])
    }

    console.error = (...args) => {
      originalConsoleError(...args)
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")

      setLogs((prev) => [...prev.slice(-19), `ERROR: ${message}`])
    }

    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
    }
  }, [])

  const handleManualReady = async () => {
    try {
      setSdkStatus("loading")
      const { sdk } = await import("@farcaster/frame-sdk")
      setSdkStatus("loaded")

      setReadyStatus("not_called")
      try {
        await sdk.actions.ready()
        setReadyStatus("success")
        console.log("Manual ready() call successful")
      } catch (err) {
        setReadyStatus("error")
        console.error("Manual ready() call failed:", err)
      }
    } catch (err) {
      setSdkStatus("error")
      console.error("Manual SDK import failed:", err)
    }
  }

  const handleForceMiniApp = () => {
    // Add a URL parameter to force mini app detection
    const url = new URL(window.location.href)
    url.searchParams.set("forceMiniApp", "true")
    window.location.href = url.toString()
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 max-w-sm bg-white border border-black/10 shadow-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2 text-xs text-left bg-black text-white flex justify-between items-center"
      >
        <span>Mini App Debug {isMiniApp ? "✅" : "❌"}</span>
        <span>{isExpanded ? "▼" : "▲"}</span>
      </button>

      {isExpanded && (
        <div className="p-2 max-h-80 overflow-auto text-xs">
          <div className="mb-2">
            <strong>Mini App:</strong> {isMiniApp ? "Yes ✅" : "No ❌"}
          </div>

          <div className="mb-2">
            <strong>URL:</strong> {window.location.href}
          </div>

          <div className="mb-2">
            <strong>User Agent:</strong> {window.navigator.userAgent}
          </div>

          <div className="mb-2">
            <strong>Detection Details:</strong>
            <pre className="mt-1 border border-black/10 p-1 bg-gray-50 max-h-32 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(detectionDetails, null, 2)}
            </pre>
          </div>

          <div className="mb-2">
            <strong>Logs:</strong>
            <div className="mt-1 border border-black/10 p-1 bg-gray-50 max-h-32 overflow-auto">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap text-[10px]">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-black/50">No logs yet</div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleManualReady}
              className="flex-1 p-1 bg-black text-white text-xs mt-2"
              disabled={sdkStatus === "loading"}
            >
              {sdkStatus === "loading" ? "Loading..." : "Try Manual ready()"}
            </button>

            <button onClick={handleForceMiniApp} className="flex-1 p-1 bg-gray-800 text-white text-xs mt-2">
              Force Mini App Mode
            </button>
          </div>

          <div className="mt-2 text-xs">
            SDK:{" "}
            {sdkStatus === "loaded"
              ? "Loaded ✅"
              : sdkStatus === "error"
                ? "Error ❌"
                : sdkStatus === "loading"
                  ? "Loading..."
                  : "Not Loaded"}
            <br />
            Ready: {readyStatus === "success" ? "Success ✅" : readyStatus === "error" ? "Error ❌" : "Not Called"}
          </div>
        </div>
      )}
    </div>
  )
}
