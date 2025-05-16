"use client"

import { useDeepLink } from "@/hooks/use-deep-link"

export function DeepLinkHandler() {
  // This hook handles all the deep linking logic
  useDeepLink()

  // This component doesn't render anything
  return null
}
