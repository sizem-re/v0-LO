import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  if (!fid) {
    return NextResponse.json({ error: "Missing fid" }, { status: 400 });
  }

  try {
    const user = await client.user.lookupByFid(Number(fid));
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
