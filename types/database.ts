// Database entity types based on the current schema

export interface User {
  id: string
  farcaster_id: string
  fid?: number
  farcaster_username?: string
  farcaster_display_name?: string
  farcaster_pfp_url?: string
  created_at: string
  updated_at: string
}

export interface List {
  id: string
  title: string
  description?: string
  visibility: 'public' | 'community' | 'private'
  owner_id: string
  cover_image_url?: string
  created_at: string
  updated_at: string
  // Populated by joins
  owner?: User
  places?: ListPlace[]
  _count?: {
    places: number
  }
}

export interface Place {
  id: string
  name: string
  address?: string
  coordinates: {
    lat: number
    lng: number
  } | null
  description?: string
  website?: string
  image_url?: string
  created_at: string
  updated_at: string
  // Populated by joins
  lists?: ListPlace[]
}

export interface ListPlace {
  id: string
  list_id: string
  place_id: string
  creator_id: string
  notes?: string
  created_at: string
  // Populated by joins
  list?: List
  place?: Place
  creator?: User
}

// API request/response types

export interface CreateListRequest {
  title: string
  description?: string
  visibility?: 'public' | 'community' | 'private'
  ownerId: string
  coverImageUrl?: string
}

export interface UpdateListRequest {
  title?: string
  description?: string
  visibility?: 'public' | 'community' | 'private'
  coverImageUrl?: string
}

export interface CreatePlaceRequest {
  name: string
  address?: string
  coordinates?: {
    lat: number
    lng: number
  }
  description?: string
  website?: string
  imageUrl?: string
}

export interface UpdatePlaceRequest {
  name?: string
  address?: string
  coordinates?: {
    lat: number
    lng: number
  }
  description?: string
  website?: string
  imageUrl?: string
}

export interface AddPlaceToListRequest {
  listId: string
  placeId: string
  notes?: string
}

export interface CreateUserRequest {
  farcaster_id: string
  farcaster_username?: string
  farcaster_display_name?: string
  farcaster_pfp_url?: string
}

// API response types

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Search and filter types

export interface ListsFilter {
  userId?: string
  fid?: string
  visibility?: 'public' | 'community' | 'private' | 'public-community'
  search?: string
  page?: number
  limit?: number
}

export interface PlacesFilter {
  listId?: string
  search?: string
  coordinates?: {
    lat: number
    lng: number
    radius?: number // in meters
  }
  page?: number
  limit?: number
}

export interface PlaceSearchResult {
  id: string
  name: string
  address?: string
  coordinates?: {
    lat: number
    lng: number
  }
  place_id?: string // Google Places ID
  types?: string[]
}

// Farcaster integration types

export interface FarcasterUser {
  fid: number
  username: string
  display_name: string
  pfp_url: string
  custody_address: string
  profile: {
    bio: {
      text: string
    }
  }
  follower_count: number
  following_count: number
  verifications: string[]
}

// Map related types

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapPosition {
  lat: number
  lng: number
  zoom?: number
}

// UI state types

export interface SidebarState {
  isOpen: boolean
  selectedPlace?: Place
  selectedList?: List
  mode: 'explore' | 'create' | 'edit' | 'profile'
}

export interface MapState {
  center: MapPosition
  zoom: number
  bounds?: MapBounds
  selectedPlaceId?: string
  hoveredPlaceId?: string
}

// Error types

export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

// Utility types

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Export all Place types from the existing place.ts file
export * from './place' 