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
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        color: "black",
        fontWeight: "bold",
      }}
    >
      LO
    </div>,
    {
      width: 512,
      height: 512,
    },
  )
}
