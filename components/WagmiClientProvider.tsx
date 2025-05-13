"use client";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "../app/lib/wagmi";
import type { ReactNode } from "react";

export function WagmiClientProvider({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
} 