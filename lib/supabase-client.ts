import { createClient } from "@supabase/supabase-js"

// Get environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Log environment variable status (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("Supabase Environment Check:", {
    url: supabaseUrl ? "SET" : "MISSING",
    anonKey: supabaseAnonKey ? "SET" : "MISSING",
    serviceKey: supabaseServiceKey ? "SET" : "MISSING",
  })
}

// Singleton pattern for client-side Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = `Missing Supabase environment variables: ${!supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL " : ""}${!supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""}`
    console.error(error)
    throw new Error(error)
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return supabaseInstance
})()

// Create a service role client for admin operations (server-side only)
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

export const supabaseAdmin = (() => {
  if (supabaseAdminInstance) return supabaseAdminInstance

  if (!supabaseUrl || !supabaseServiceKey) {
    const error = `Missing Supabase admin environment variables: ${!supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL " : ""}${!supabaseServiceKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`
    console.error(error)
    throw new Error(error)
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })

  return supabaseAdminInstance
})()

// Helper function to create a new client instance when needed
export function createSupabaseClient(customUrl?: string, customKey?: string) {
  const url = customUrl || supabaseUrl
  const key = customKey || supabaseAnonKey

  if (!url || !key) {
    throw new Error("Supabase configuration is incomplete")
  }

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

// Re-export createClient for use in other files
export { createClient }
