import type { NextRequest } from "next/server"
import { supabase } from "./supabase-client"

export async function getUserFromRequest(request: NextRequest) {
  // Get the token from the cookie
  const token = request.cookies.get("sb-access-token")?.value

  if (!token) {
    return null
  }

  try {
    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error("Error getting user:", error)
      return null
    }

    // Get additional user data if needed
    const { data: userData, error: userError } = await supabase.from("users").select("fid").eq("id", user.id).single()

    if (userError && userError.code !== "PGRST116") {
      console.error("Error getting user data:", userError)
    }

    return {
      ...user,
      fid: userData?.fid || null,
    }
  } catch (error) {
    console.error("Error in getUserFromRequest:", error)
    return null
  }
}
