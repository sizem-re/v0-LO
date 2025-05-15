interface Window {
  ethereum?: {
    isMetaMask?: boolean
    request: (request: { method: string; params?: any[] }) => Promise<any>
    on: (event: string, callback: (...args: any[]) => void) => void
    removeListener: (event: string, callback: (...args: any[]) => void) => void
  }
  L?: any // Leaflet global object
  farcaster?: {
    setReady: () => void
    isAuthenticated: () => boolean
    getUser: () => any
    subscribe: (event: string, callback: (data: any) => void) => void
    publishCast: (text: string) => Promise<any>
  }
}
