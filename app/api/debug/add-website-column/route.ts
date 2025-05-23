import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET() {
  try {
    // Check if the website column exists
    const { data: columnInfo, error: checkError } = await supabaseAdmin.rpc("check_column_exists", {
      table_name: "places",
      column_name: "website",
    })

    if (checkError) {
      console.error("Error checking if website column exists:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // If column exists, return success
    if (columnInfo && columnInfo.exists) {
      return NextResponse.json({
        message: "Website column already exists in places table",
        exists: true,
      })
    }

    // If column doesn't exist, add it
    const { error: alterError } = await supabaseAdmin.rpc("add_column_if_not_exists", {
      table_name: "places",
      column_name: "website",
      column_type: "text",
    })

    if (alterError) {
      console.error("Error adding website column:", alterError)
      return NextResponse.json({ error: alterError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "Website column added successfully to places table",
      exists: false,
      added: true,
    })
  } catch (error) {
    console.error("Error in add-website-column route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
