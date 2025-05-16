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
