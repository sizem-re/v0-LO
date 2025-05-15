// Types
export type FarcasterUser = {
  fid: number
  username: string
  displayName: string
  pfp: string
  profile?: {
    bio?: string
  }
}

// Check if the user is authenticated
export async function getAuthStatus(): Promise<{ authenticated: boolean; fid?: number }> {
  // Check if we have a stored FID
  const fid = localStorage.getItem("farcaster_fid")

  if (!fid) {
    return { authenticated: false }
  }

  return {
    authenticated: true,
    fid: Number.parseInt(fid, 10),
  }
}

// Get Farcaster user data
export async function getFarcasterUser(fid: number): Promise<FarcasterUser | null> {
  try {
    // Use the Warpcast public API to get user data
    const response = await fetch(`https://api.warpcast.com/v2/user-by-fid?fid=${fid}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }

    const data = await response.json()
    const user = data.result.user

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName || user.username,
      pfp: user.pfp?.url || "",
      profile: {
        bio: user.profile?.bio || "",
      },
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

// Post a cast to Farcaster
export async function postCast(text: string): Promise<boolean> {
  try {
    // For client-side only, we'll use the window.open approach to let users post manually
    const encodedText = encodeURIComponent(text)
    window.open(`https://warpcast.com/~/compose?text=${encodedText}`, "_blank")
    return true
  } catch (error) {
    console.error("Error posting cast:", error)
    return false
  }
}
