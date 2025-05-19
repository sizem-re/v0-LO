import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Log environment variable status (not their values) for debugging
console.log("Supabase URL defined:", !!supabaseUrl)
console.log("Supabase Anon Key defined:", !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection and log detailed errors
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Supabase connection error:", error.message, error)
  } else {
    console.log("Supabase connection successful")
  }
})
