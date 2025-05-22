import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// Sample data for seeding
const sampleUsers = [
  {
    id: uuidv4(),
    farcaster_id: "12345",
    farcaster_username: "coffeeexplorer",
    farcaster_display_name: "Coffee Explorer",
    farcaster_pfp_url: "/diverse-profile-avatars.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const sampleLists = [
  {
    id: uuidv4(),
    title: "Best Coffee Shops in Seattle",
    description: "My favorite places to grab coffee and work in Seattle",
    visibility: "public",
    owner_id: "", // Will be set to the first user's ID
    cover_image_url: "/cozy-corner-cafe.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Hidden Gems in Portland",
    description: "Off the beaten path spots in Portland",
    visibility: "public",
    owner_id: "", // Will be set to the first user's ID
    cover_image_url: "/portland-cityscape.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const samplePlaces = [
  {
    id: uuidv4(),
    name: "Analog Coffee",
    description: "Great pour-overs and minimalist vibe",
    address: "235 Summit Ave E, Seattle, WA 98102",
    latitude: 47.6205,
    longitude: -122.3252,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=coffee%20shop%20interior",
  },
  {
    id: uuidv4(),
    name: "Victrola Coffee Roasters",
    description: "Spacious cafe with excellent espresso",
    address: "310 E Pike St, Seattle, WA 98122",
    latitude: 47.6142,
    longitude: -122.3266,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=coffee%20roastery",
  },
  {
    id: uuidv4(),
    name: "Storyville Coffee",
    description: "Amazing views and great pastries",
    address: "94 Pike St #34, Seattle, WA 98101",
    latitude: 47.6088,
    longitude: -122.3404,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=coffee%20shop%20with%20view",
  },
  {
    id: uuidv4(),
    name: "Powell's Books",
    description: "World's largest independent bookstore",
    address: "1005 W Burnside St, Portland, OR 97209",
    latitude: 45.5231,
    longitude: -122.6814,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=bookstore%20interior",
  },
  {
    id: uuidv4(),
    name: "Voodoo Doughnut",
    description: "Famous for unique doughnut creations",
    address: "22 SW 3rd Ave, Portland, OR 97204",
    latitude: 45.5226,
    longitude: -122.6731,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=colorful%20donuts",
  },
]

// List-place associations
const listPlacesAssociations = [
  // Seattle coffee list places
  { list_index: 0, place_indices: [0, 1, 2] },
  // Portland hidden gems list places
  { list_index: 1, place_indices: [3, 4] },
]

export async function GET() {
  try {
    // Insert users
    const { data: userData, error: userError } = await supabaseAdmin.from("users").insert(sampleUsers).select()

    if (userError) {
      console.error("Error inserting users:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    const userId = userData[0].id

    // Update lists with the user ID
    const listsWithOwner = sampleLists.map((list) => ({
      ...list,
      owner_id: userId,
    }))

    // Insert lists
    const { data: listsData, error: listsError } = await supabaseAdmin.from("lists").insert(listsWithOwner).select()

    if (listsError) {
      console.error("Error inserting lists:", listsError)
      return NextResponse.json({ error: listsError.message }, { status: 500 })
    }

    // Insert places
    const { data: placesData, error: placesError } = await supabaseAdmin.from("places").insert(samplePlaces).select()

    if (placesError) {
      console.error("Error inserting places:", placesError)
      return NextResponse.json({ error: placesError.message }, { status: 500 })
    }

    // Create list_places associations
    const listPlacesData = []
    for (const assoc of listPlacesAssociations) {
      const listId = listsData[assoc.list_index].id
      for (const placeIndex of assoc.place_indices) {
        listPlacesData.push({
          id: uuidv4(),
          list_id: listId,
          place_id: placesData[placeIndex].id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    const { error: listPlacesError } = await supabaseAdmin.from("list_places").insert(listPlacesData)

    if (listPlacesError) {
      console.error("Error inserting list_places:", listPlacesError)
      return NextResponse.json({ error: listPlacesError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        users: userData,
        lists: listsData,
        places: placesData,
        listPlaces: listPlacesData.length,
      },
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
