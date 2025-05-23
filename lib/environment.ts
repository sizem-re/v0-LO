/**
 * Utility to detect the environment the app is running in
 * This is for debugging only and doesn't block the app from loading
 */
export function detectEnvironment() {
  if (typeof window === "undefined") {
    return {
      isBrowser: false,
      isMiniApp: false,
      isWarpcast: false,
      environment: "server",
    }
  }

  const isMiniApp =
    window.location.href.includes("farcaster://") ||
    window.navigator.userAgent.includes("Farcaster") ||
    window.location.hostname.includes("warpcast.com") ||
    window.location.search.includes("miniApp=true") ||
    window.location.pathname.startsWith("/mini") ||
    window.location.search.includes("fc-frame")

  const isWarpcast =
    window.location.hostname.includes("warpcast.com") || window.navigator.userAgent.includes("Warpcast")

  return {
    isBrowser: true,
    isMiniApp,
    isWarpcast,
    environment: isWarpcast ? "warpcast" : isMiniApp ? "miniapp" : "browser",
  }
}

// Environment variable validation and typing

interface EnvironmentVariables {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // Neynar (Farcaster)
  NEYNAR_API_KEY: string
  NEXT_PUBLIC_NEYNAR_CLIENT_ID: string

  // Google Places API
  GOOGLE_PLACES_API_KEY: string

  // NextJS
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL: string

  // App
  NEXT_PUBLIC_APP_URL: string
  NEXT_PUBLIC_APP_NAME: string
}

// Helper to check if a variable is defined and non-empty
const isValidVar = (value: string | undefined): value is string => {
  return value !== undefined && value !== ''
}

// Validate all required environment variables
const validateEnv = (): EnvironmentVariables => {
  // Required variables and their descriptions
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
    SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key',
    NEYNAR_API_KEY: 'Neynar API key',
    NEXT_PUBLIC_NEYNAR_CLIENT_ID: 'Neynar client ID',
    GOOGLE_PLACES_API_KEY: 'Google Places API key',
    NEXTAUTH_SECRET: 'NextAuth secret key',
    NEXTAUTH_URL: 'NextAuth URL',
    NEXT_PUBLIC_APP_URL: 'App URL',
    NEXT_PUBLIC_APP_NAME: 'App name'
  } as const

  // Check each variable
  const missingVars = Object.entries(requiredVars)
    .filter(([key]) => !isValidVar(process.env[key]))
    .map(([key, desc]) => `${key} (${desc})`)

  // Throw error if any required variables are missing
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.join('\n')}`
    )
  }

  // Return typed environment variables
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NEYNAR_API_KEY: process.env.NEYNAR_API_KEY!,
    NEXT_PUBLIC_NEYNAR_CLIENT_ID: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID!,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME!
  }
}

// Export validated environment variables
export const env = validateEnv()

// Helper to get public environment variables for client-side use
export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_NEYNAR_CLIENT_ID: env.NEXT_PUBLIC_NEYNAR_CLIENT_ID,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME
}
