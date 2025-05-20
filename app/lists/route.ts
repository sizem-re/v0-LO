import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

export function GET(request: NextRequest) {
  redirect("/map")
}
