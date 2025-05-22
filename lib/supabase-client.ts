import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
}

// Create client with error handling
export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co", // Fallback to prevent crashes
  supabaseAnonKey || "placeholder-key", // Fallback to prevent crashes
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)

// Create a service role client for admin operations (server-side only)
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseServiceKey || "placeholder-key",
  {
    auth: {
      persistSession: false,
    },
  },
)

// Re-export createClient for use in other files
export { createClient }
