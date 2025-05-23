import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get all user data for debugging
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Get all list_places entries for this user
    const { data: listPlacesData, error: listPlacesError } = await supabase
      .from("list_places")
      .select("*")
      .eq("added_by", userId)

    if (listPlacesError) {
      console.error("Error fetching list_places data:", listPlacesError)
      return NextResponse.json({ error: "Failed to fetch list_places data" }, { status: 500 })
    }

    return NextResponse.json({
      user: userData,
      listPlaces: listPlacesData,
      userIdQueried: userId,
    })
  } catch (error) {
    console.error("Error in debug user route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
