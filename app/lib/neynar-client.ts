// Mock Neynar client implementation for development

/**
 * Create a new signer for Farcaster
 */
export async function createSigner() {
  return {
    success: true,
    signer: {
      uuid: "mock-signer-uuid",
      status: "pending_approval",
      publicKey: "mock-public-key",
    },
  }
}

/**
 * Publish a new cast using the Neynar API
 */
export async function publishCast(
  signerUuid: string,
  text: string,
  options: {
    embeds?: Array<{ url: string }>
    mentions?: number[]
    mentionsPositions?: number[]
  } = {}
) {
  return {
    success: true,
    cast: {
      hash: "mock-cast-hash",
      threadHash: "mock-thread-hash",
      author: {
        fid: 12345,
        username: "mock_user",
        displayName: "Mock User",
      },
      text,
      timestamp: new Date().toISOString(),
      embeds: options.embeds || [],
      mentions: options.mentions || [],
      mentionsPositions: options.mentionsPositions || [],
    },
  }
}

/**
 * Verify a signature for Farcaster authentication
 */
export async function verifySignature(params: {
  fid: number
  message: string
  signature: string
  deadline: number
}) {
  return {
    success: true,
    valid: true,
    fid: params.fid,
  }
}

/**
 * Get user data for a given FID
 */
export async function getUserData(fid: number) {
  return {
    success: true,
    user: {
      fid,
      username: "mock_user",
      displayName: "Mock User",
      pfp: "/placeholder.svg?height=100&width=100",
      profile: {
        bio: "This is a mock user profile for development",
      },
    },
  }
} 