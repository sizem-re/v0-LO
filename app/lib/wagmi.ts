import { createConfig, http } from "wagmi"
import { mainnet } from "wagmi/chains"

// Create a simple wagmi config with mainnet
export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
}) 