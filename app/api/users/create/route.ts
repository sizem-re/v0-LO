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
      return NextResponse.json(
        {
          error: "Missing Supabase credentials",
          details: {
            urlDefined: !!supabaseUrl,
            keyDefined: !!supabaseServiceKey,
          },
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Try to create the user directly - if the table doesn't exist, we'll get an error
    try {
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
        return NextResponse.json(
          {
            error: "Failed to create user",
            details: {
              message: error.message,
              code: error.code,
              hint: error.hint,
            },
          },
          { status: 500 },
        )
      }

      return NextResponse.json(data[0])
    } catch (insertError: any) {
      return NextResponse.json(
        {
          error: "Exception during user creation",
          details: {
            message: insertError.message,
          },
        },
        { status: 500 },
      )
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
