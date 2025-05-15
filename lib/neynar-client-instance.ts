import { NeynarAPIClient } from "@neynar/nodejs-sdk"

// Initialize the Neynar client with your API key
// This will only run on the server
const neynarClient = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY || "",
})

export default neynarClient
