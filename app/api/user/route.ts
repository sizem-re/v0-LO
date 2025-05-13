import { NextRequest } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
});
const client = new NeynarAPIClient(config);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  if (!fid) {
    return new Response(JSON.stringify({ error: "Missing fid" }), { status: 400 });
  }

  try {
    const user = await client.lookupUserByFid({ fid: Number(fid) });
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
