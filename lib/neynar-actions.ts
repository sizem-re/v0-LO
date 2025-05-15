"use server"

import * as neynarClient from "./neynar-client"

// Server action to fetch user data
export async function fetchUserData(fid: number) {
  try {
    const response = await neynarClient.lookupUserByFid(fid)
    return response.user
  } catch (error) {
    console.error("Error fetching user data:", error)
    throw new Error("Failed to fetch user data")
  }
}

// Server action to verify a signature
export async function verifySignature(params: {
  fid: number
  message: string
  signature: string
  deadline: number
}) {
  try {
    const response = await neynarClient.verifySignature(params)
    return response
  } catch (error) {
    console.error("Error verifying signature:", error)
    throw new Error("Failed to verify signature")
  }
}

// Server action to create a signer
export async function createSigner() {
  try {
    const response = await neynarClient.createSigner()
    return response
  } catch (error) {
    console.error("Error creating signer:", error)
    throw new Error("Failed to create signer")
  }
}

// Server action to publish a cast
export async function publishCast(
  signerUuid: string,
  text: string,
  options?: {
    embeds?: any[]
    mentions?: number[]
    mentionsPositions?: number[]
  },
) {
  try {
    const response = await neynarClient.publishCast(signerUuid, text, options)
    return response
  } catch (error) {
    console.error("Error publishing cast:", error)
    throw new Error("Failed to publish cast")
  }
}
