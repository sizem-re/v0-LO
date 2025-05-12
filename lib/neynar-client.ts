"use server"

import neynarClient from "./neynar-client-instance"

// Server function to fetch user data
export async function lookupUserByFid(fid: number) {
  try {
    return await neynarClient.lookupUserByFid(fid)
  } catch (error) {
    console.error("Error looking up user by FID:", error)
    throw new Error("Failed to look up user by FID")
  }
}

// Server function to create a signer
export async function createSigner() {
  try {
    return await neynarClient.createSigner()
  } catch (error) {
    console.error("Error creating signer:", error)
    throw new Error("Failed to create signer")
  }
}

// Server function to verify a signature
export async function verifySignature(params: {
  fid: number
  message: string
  signature: string
  deadline: number
}) {
  try {
    return await neynarClient.verifySignature(params)
  } catch (error) {
    console.error("Error verifying signature:", error)
    throw new Error("Failed to verify signature")
  }
}

// Server function to publish a cast
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
    return await neynarClient.publishCast(signerUuid, text, options)
  } catch (error) {
    console.error("Error publishing cast:", error)
    throw new Error("Failed to publish cast")
  }
}
