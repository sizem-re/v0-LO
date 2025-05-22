import type { DbUser } from "@/types/auth"

interface List {
  id: string
  owner_id: string
  visibility: "private" | "public" | "community"
}

export function canEditList(user: DbUser | null, list: List): boolean {
  if (!user) return false
  return user.id === list.owner_id
}

export function canAddToList(user: DbUser | null, list: List): boolean {
  if (!user) return false

  // Owner can always add
  if (user.id === list.owner_id) return true

  // For community lists, any authenticated user can add
  if (list.visibility === "community") return true

  // For public lists, only the owner can add
  return false
}

export function canViewList(user: DbUser | null, list: List): boolean {
  // Public and community lists are visible to everyone
  if (list.visibility === "public" || list.visibility === "community") return true

  // Private lists are only visible to the owner
  if (!user) return false
  return user.id === list.owner_id
}
