import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create the users table using raw SQL
    const { error } = await supabase.rpc("create_users_table")

    if (error) {
      // If the RPC doesn't exist, try direct SQL
      const { error: sqlError } = await supabase.rpc("execute_sql", {
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

      if (sqlError) {
        return NextResponse.json({ error: "Failed to create users table", details: sqlError }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Database setup completed" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
