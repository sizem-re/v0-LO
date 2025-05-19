import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const userData = await request.json()

    // Validate required fields
    if (!userData.farcaster_id) {
      return NextResponse.json({ error: "Missing required field: farcaster_id" }, { status: 400 })
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          error: "Missing Supabase credentials",
          details: {
            urlDefined: !!supabaseUrl,
            serviceKeyDefined: !!supabaseServiceKey,
          },
        },
        { status: 500 },
      )
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if users table exists
    try {
      const { error: tableCheckError } = await supabaseAdmin.from("users").select("count").limit(1)

      if (
        tableCheckError &&
        tableCheckError.message.includes("relation") &&
        tableCheckError.message.includes("does not exist")
      ) {
        // Create users table if it doesn't exist
        const { error: createTableError } = await supabaseAdmin.rpc("execute_sql", {
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
            
            -- Disable RLS for admin operations
            ALTER TABLE users DISABLE ROW LEVEL SECURITY;
          `,
        })

        if (createTableError) {
          return NextResponse.json(
            { error: "Failed to create users table", details: createTableError },
            { status: 500 },
          )
        }
      }
    } catch (tableError) {
      console.error("Error checking/creating users table:", tableError)
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("farcaster_id", userData.farcaster_id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: "Error checking for existing user", details: fetchError }, { status: 500 })
    }

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          farcaster_username: userData.farcaster_username || "",
          farcaster_display_name: userData.farcaster_display_name || "",
          farcaster_pfp_url: userData.farcaster_pfp_url || "",
          updated_at: new Date().toISOString(),
        })
        .eq("farcaster_id", userData.farcaster_id)
        .select()

      if (error) {
        return NextResponse.json({ error: "Failed to update user", details: error }, { status: 500 })
      }

      return NextResponse.json(data[0])
    } else {
      // Create new user
      const { data, error } = await supabaseAdmin
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
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: {
          message: error.message,
        },
      },
      { status: 500 },
    )
  }
}
