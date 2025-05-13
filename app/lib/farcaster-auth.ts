// Basic Farcaster authentication utility functions

/**
 * Get the authentication status of the current user
 * @returns Object with authentication status and FID
 */
export async function getAuthStatus(): Promise<{ authenticated: boolean; fid?: number }> {
  try {
    const fidString = localStorage.getItem("farcaster_fid")
    if (!fidString) {
      return { authenticated: false }
    }
    
    const fid = parseInt(fidString, 10)
    if (isNaN(fid)) {
      return { authenticated: false }
    }
    
    return { authenticated: true, fid }
  } catch (error) {
    console.error("Error checking auth status:", error)
    return { authenticated: false }
  }
}

/**
 * Get user data for a given Farcaster ID
 * @param fid Farcaster ID
 * @returns User data or null if not found
 */
export async function getFarcasterUser(fid: number) {
  try {
    // This would normally make an API call to get user data
    // For now, we'll return mock data
    return {
      fid,
      username: "example_user",
      displayName: "Example User",
      pfp: "/placeholder.svg?height=100&width=100",
      profile: {
        bio: "This is a mock Farcaster user profile",
      },
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

/**
 * Opens a new window to post a cast to Farcaster (Warpcast)
 * @param text The text content to post
 * @returns A promise that resolves to true if the window was opened successfully
 */
export async function postCast(text: string): Promise<boolean> {
  try {
    // Encode the text for the URL
    const encodedText = encodeURIComponent(text)
    
    // Open Warpcast in a new tab
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedText}`
    window.open(warpcastUrl, '_blank')
    
    return true
  } catch (error) {
    console.error("Error posting to Farcaster:", error)
    return false
  }
}

/**
 * Checks if the user is authenticated with Farcaster
 * This is a placeholder - in a real app this would verify with the Farcaster API
 */
export function checkFarcasterAuth(): boolean {
  // In a real implementation, this would check authentication status
  return localStorage.getItem("farcaster_fid") !== null
} 