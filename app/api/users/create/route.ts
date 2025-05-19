import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const userData = await request.json()

    // Validate required fields
    if (!userData.farcaster_id) {
      return NextResponse.json({ error: "Missing required field: farcaster_id" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if users table exists and create it if it doesn't
    try {
      const { error: checkError } = await supabase.from("users").select("count").limit(1)

      if (checkError && checkError.message.includes("relation") && checkError.message.includes("does not exist")) {
        // Create users table
        const { error: createError } = await supabase.rpc("execute_sql", {
          sql: `
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
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

        if (createError) {
          return NextResponse.json({ error: "Failed to create users table", details: createError }, { status: 500 })
        }
      }
    } catch (tableError) {
      console.error("Error checking/creating users table:", tableError)
      // Continue anyway, as the table might already exist
    }

    // Create the user
    const { data, error } = await supabase
      .from("users")
      .insert({
        farcaster_id: userData.farcaster_id,
        farcaster_username: userData.farcaster_username || "",
        farcaster_display_name: userData.farcaster_display_name || "",
        farcaster_pfp_url: userData.farcaster_pfp_url || "",
      })
      .select()

    if (error) {
      return NextResponse.json({ error: "Failed to create user", details: error }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in user creation API:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
