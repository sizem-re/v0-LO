import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get("fid")

    if (fid) {
      // Search for specific FID
      console.log(`Searching for FID: ${fid}`)

      const searches = [
        { name: "farcaster_id (string)", query: supabase.from("users").select("*").eq("farcaster_id", fid) },
        { name: "fid (integer)", query: supabase.from("users").select("*").eq("fid", Number.parseInt(fid)) },
        {
          name: "farcaster_id (integer)",
          query: supabase.from("users").select("*").eq("farcaster_id", Number.parseInt(fid)),
        },
      ]

      const results = {}
      for (const search of searches) {
        try {
          const { data, error } = await search.query.maybeSingle()
          results[search.name] = { data, error: error?.message }
        } catch (err) {
          results[search.name] = { error: err.message }
        }
      }

      return NextResponse.json({
        fid,
        searches: results,
      })
    }

    // Get all users with FID data
    const { data: users, error } = await supabase
      .from("users")
      .select("id, fid, farcaster_id, farcaster_username, farcaster_display_name")
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      users,
      count: users?.length || 0,
    })
  } catch (error) {
    console.error("Error in GET /api/debug/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
