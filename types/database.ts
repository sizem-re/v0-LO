export interface List {
  id: string
  title: string
  description: string | null
  privacy: "private" | "public" | "open"
  created_at: string
  updated_at: string
  user_id: string
  fid: number | null
}

export interface Place {
  id: string
  name: string
  address: string
  description: string | null
  type: string | null
  website: string | null
  lat: number
  lng: number
  image_url: string | null
  created_at: string
  updated_at: string
  user_id: string
  fid: number | null
}

export interface PlacesList {
  id: string
  place_id: string
  list_id: string
  created_at: string
  user_id: string
}

export interface PlaceWithLists extends Place {
  lists: List[]
}

export interface ListWithPlaces extends List {
  places: Place[]
  place_count: number
}
