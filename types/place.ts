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
  addedAt?: string
  notes?: string
}
