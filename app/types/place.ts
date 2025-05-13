export type Place = {
  id: string
  name: string
  type: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  description?: string
  image?: string
} 