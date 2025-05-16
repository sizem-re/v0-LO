interface Window {
  ethereum?: {
    isMetaMask?: boolean
    request: (request: { method: string; params?: any[] }) => Promise<any>
    on: (event: string, callback: (...args: any[]) => void) => void
    removeListener: (event: string, callback: (...args: any[]) => void) => void
  }
  L?: any // Leaflet global object
  farcaster?: any // Farcaster global object
  forceMiniApp?: boolean // Flag to force mini app mode
}
