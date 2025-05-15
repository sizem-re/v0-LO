import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 40,
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <div style={{ fontSize: 80, fontWeight: "bold", marginBottom: "20px" }}>LO</div>
      <div style={{ fontSize: 36, color: "#666", textAlign: "center" }}>
        Discover and share curated lists of locations
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
