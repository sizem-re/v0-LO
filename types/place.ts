export interface Place {
  id: string
  name: string
  type: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  description?: string
  website?: string
  image?: string
  notes?: string
  listPlaceId?: string
  addedAt?: string
  addedBy?: string
}
