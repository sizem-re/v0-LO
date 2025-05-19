import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if users table exists
    const { error: checkError } = await supabase.from("users").select("count").limit(1)

    if (checkError) {
      console.log("Error checking users table:", checkError.message)

      // If table doesn't exist, create it
      if (checkError.message.includes("relation") && checkError.message.includes("does not exist")) {
        // Create users table
        const { error: createError } = await supabase.rpc("create_users_table_if_not_exists", {})

        if (createError) {
          console.error("Error creating users table:", createError)

          // Try direct SQL as fallback
          const { error: sqlError } = await supabase.rpc("execute_sql", {
            sql: `
              CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                farcaster_id VARCHAR UNIQUE,
                farcaster_username VARCHAR,
                farcaster_display_name VARCHAR,
                farcaster_pfp_url VARCHAR,
                wallet_address VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `,
          })

          if (sqlError) {
            return NextResponse.json({ error: "Failed to create users table", details: sqlError }, { status: 500 })
          }

          return NextResponse.json({ message: "Users table created with direct SQL" })
        }

        return NextResponse.json({ message: "Users table created successfully" })
      }

      return NextResponse.json({ error: "Error checking users table", details: checkError }, { status: 500 })
    }

    return NextResponse.json({ message: "Users table exists" })
  } catch (error) {
    console.error("Error in setup-db route:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
