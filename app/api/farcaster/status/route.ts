import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "LO",
    version: "1.0.0",
    miniAppSupport: true,
    timestamp: new Date().toISOString(),
  })
}
