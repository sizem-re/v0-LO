export interface DbUser {
  id: string
  farcaster_id: string
  farcaster_username?: string
  farcaster_display_name?: string
  farcaster_pfp_url?: string
  created_at: string
  updated_at: string
}

export interface NeynarUser {
  fid: number
  username?: string
  display_name?: string
  pfp_url?: string
}
