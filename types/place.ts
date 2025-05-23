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
  website_url?: string
  lat?: string
  lng?: string
  created_at?: string
  addedAt?: string
  notes?: string
  lists?: Array<{
    id: string
    title: string
    type: string
  }>
}
