export interface Place {
  id: string
  name: string
  type?: string
  address?: string
  coordinates: {
    lat: number
    lng: number
  }
  description?: string
  image?: string
  website?: string
  addedBy?: string // User ID who added the place
  addedByUser?: {
    id: string
    farcaster_username?: string
    farcaster_display_name?: string
    farcaster_pfp_url?: string
  }
  created_by?: string // For backward compatibility
  created_by_user?: {
    id: string
    farcaster_username?: string
    farcaster_display_name?: string
    farcaster_pfp_url?: string
  }
}
