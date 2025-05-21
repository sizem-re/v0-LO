export async function GET() {
  return Response.redirect(new URL("/map", process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"))
}
