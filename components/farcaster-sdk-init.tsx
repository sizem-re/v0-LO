"use client";
import { useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";

export function FarcasterSDKInit() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);
  return null;
} 