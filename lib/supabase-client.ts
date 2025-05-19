import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

// Setup the database if needed
export const setupDatabase = async () => {
  try {
    const response = await fetch("/api/setup-db")
    return await response.json()
  } catch (error) {
    console.error("Error setting up database:", error)
    return { error: "Failed to set up database" }
  }
}
