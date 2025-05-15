"use client"

import type React from "react"

import { useState } from "react"
import { saveEmail } from "@/app/actions"

export default function EmailForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    try {
      setStatus("loading")
      const result = await saveEmail(email)

      if (result.success) {
        setStatus("success")
        setMessage("Thank you! We'll keep you updated.")
        setEmail("")
      } else {
        setStatus("error")
        setMessage(result.message || "Something went wrong. Please try again.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-md focus:outline-none focus:ring-2 focus:ring-white/30"
            required
            disabled={status === "loading"}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 bg-white text-indigo-800 font-medium rounded-md hover:bg-white/90 transition-colors disabled:opacity-70"
          >
            {status === "loading" ? "Saving..." : "Notify Me"}
          </button>
        </div>

        {status !== "idle" && (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-green-300"}`}>{message}</p>
        )}
      </form>
    </div>
  )
}
