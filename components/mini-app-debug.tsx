"use client"

import { useState } from "react"
import { useFarcasterSDK } from "@/lib/farcaster-sdk-context"

export function MiniAppDebug() {
  const { isMiniApp, isLoaded, isReady, sdk } = useFarcasterSDK()
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]}: ${message}`])
  }

  const testReady = async () => {
    if (!sdk) {
      addLog("SDK not loaded")
      return
    }

    try {
      addLog("Sending ready signal...")
      await sdk.actions.ready()
      addLog("Ready signal sent successfully")
    } catch (error) {
      addLog(`Error sending ready signal: ${error}`)
    }
  }

  const testComposeCast = async () => {
    if (!sdk) {
      addLog("SDK not loaded")
      return
    }

    try {
      addLog("Opening compose cast...")
      await sdk.actions.composeCast({
        text: "Testing compose cast from LO app",
      })
      addLog("Compose cast opened successfully")
    } catch (error) {
      addLog(`Error opening compose cast: ${error}`)
    }
  }

  if (!isMiniApp) return null

  return (
    <div className="fixed bottom-16 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black text-white p-2 rounded-full shadow-lg"
        aria-label="Debug Mini App"
      >
        🐞
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-4 w-80 bg-white border border-black/20 shadow-lg p-4 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Mini App Debug</h3>
            <button onClick={() => setIsOpen(false)} className="text-black/60">
              ✕
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-xs">
              <span className="font-bold">Is Mini App:</span> {isMiniApp ? "✅" : "❌"}
            </div>
            <div className="text-xs">
              <span className="font-bold">SDK Loaded:</span> {isLoaded ? "✅" : "❌"}
            </div>
            <div className="text-xs">
              <span className="font-bold">Ready Sent:</span> {isReady ? "✅" : "❌"}
            </div>
          </div>

          <div className="space-x-2 mb-4">
            <button onClick={testReady} className="text-xs bg-black text-white px-2 py-1">
              Test Ready
            </button>
            <button onClick={testComposeCast} className="text-xs bg-black text-white px-2 py-1">
              Test Cast
            </button>
          </div>

          <div className="h-32 overflow-y-auto border border-black/10 p-2 text-xs font-mono">
            {logs.length === 0 ? (
              <div className="text-black/40">No logs yet</div>
            ) : (
              logs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
