import { createClient } from "@supabase/supabase-js"

// Get environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Singleton pattern for client-side Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
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
    console.error("Missing Supabase service role environment variables")
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
    console.error("Cannot create Supabase client: missing URL or API key")
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
// This is required by other parts of the application
export { createClient }
