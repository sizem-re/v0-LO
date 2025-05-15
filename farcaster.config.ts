// This file defines the configuration for the Farcaster Mini App
// Since @farcaster/mini-app doesn't exist, we'll create a simple config object

const farcasterConfig = {
  name: "LO",
  description: "Discover and share curated lists of locations",
  icon: "https://lo-app.xyz/icon.png", // Replace with your actual icon URL
  domain: "lo-app.xyz", // Replace with your actual domain
  permissions: ["cast:write", "user:read", "channel:read", "channel:write", "notification:read", "notification:write"],
}

export default farcasterConfig
