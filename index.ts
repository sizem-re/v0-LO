import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const config = new Configuration({
  apiKey: "FEE179BF-430D-4E76-9B81-06077F8ADFB0", // <-- Replace with your real API key
});

const client = new NeynarAPIClient(config);

// Example: fetch your own user profile (replace with your FID)
client.fetchBulkUsers({ fids: [1234] }).then((response) => {
  console.log("response:", response);
});