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
  {
    id: uuidv4(),
    farcaster_id: "67890",
    farcaster_username: "urbanadventurer",
    farcaster_display_name: "Urban Adventurer",
    farcaster_pfp_url: "/diverse-profile-avatars.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    farcaster_id: "11111",
    farcaster_username: "foodiefan",
    farcaster_display_name: "Foodie Fan",
    farcaster_pfp_url: "/diverse-profile-avatars.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    farcaster_id: "22222",
    farcaster_username: "naturelover",
    farcaster_display_name: "Nature Lover",
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
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Hidden Gems in Portland",
    description: "Off the beaten path spots in Portland that locals love",
    visibility: "public",
    owner_id: "", // Will be set to different user
    cover_image_url: "/portland-cityscape.png",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "NYC Food Scene Must-Tries",
    description: "The best restaurants and food trucks in New York City",
    visibility: "community",
    owner_id: "", // Will be set to different user
    cover_image_url: "/nyc-food.png",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Bay Area Hiking Trails",
    description: "Beautiful hiking spots around San Francisco Bay Area",
    visibility: "public",
    owner_id: "", // Will be set to different user
    cover_image_url: "/bay-area-trails.png",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Rooftop Bars with Views",
    description: "Best rooftop bars for drinks with amazing city views",
    visibility: "community",
    owner_id: "", // Will be set to different user
    cover_image_url: "/rooftop-bars.png",
    created_at: new Date().toISOString(), // Today
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Bookworm Paradise",
    description: "Cozy bookstores and reading spots around the city",
    visibility: "public",
    owner_id: "", // Will be set to different user
    cover_image_url: "/bookstores.png",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date().toISOString(),
  },
]

const samplePlaces = [
  {
    id: uuidv4(),
    name: "Analog Coffee",
    description: "Great pour-overs and minimalist vibe",
    address: "235 Summit Ave E, Seattle, WA 98102",
    coordinates: `POINT(-122.3252 47.6205)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=coffee%20shop%20interior",
  },
  {
    id: uuidv4(),
    name: "Victrola Coffee Roasters",
    description: "Spacious cafe with excellent espresso",
    address: "310 E Pike St, Seattle, WA 98122",
    coordinates: `POINT(-122.3266 47.6142)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=coffee%20roastery",
  },
  {
    id: uuidv4(),
    name: "Storyville Coffee",
    description: "Amazing views and great pastries",
    address: "94 Pike St #34, Seattle, WA 98101",
    coordinates: `POINT(-122.3404 47.6088)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=coffee%20shop%20with%20view",
  },
  {
    id: uuidv4(),
    name: "Powell's Books",
    description: "World's largest independent bookstore",
    address: "1005 W Burnside St, Portland, OR 97209",
    coordinates: `POINT(-122.6814 45.5231)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=bookstore%20interior",
  },
  {
    id: uuidv4(),
    name: "Voodoo Doughnut",
    description: "Famous for unique doughnut creations",
    address: "22 SW 3rd Ave, Portland, OR 97204",
    coordinates: `POINT(-122.6731 45.5226)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=colorful%20donuts",
  },
  {
    id: uuidv4(),
    name: "Joe's Pizza",
    description: "Classic New York style pizza",
    address: "7 Carmine St, New York, NY 10014",
    coordinates: `POINT(-74.0027 40.7301)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=new%20york%20pizza",
  },
  {
    id: uuidv4(),
    name: "Xi'an Famous Foods",
    description: "Authentic hand-pulled noodles and Chinese street food",
    address: "81 St Marks Pl, New York, NY 10003",
    coordinates: `POINT(-73.9871 40.7282)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=chinese%20noodles",
  },
  {
    id: uuidv4(),
    name: "Mount Tamalpais State Park",
    description: "Stunning views of the Bay Area",
    address: "801 Panoramic Hwy, Mill Valley, CA 94941",
    coordinates: `POINT(-122.5966 37.9236)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=mountain%20hiking%20trail",
  },
  {
    id: uuidv4(),
    name: "Muir Woods National Monument",
    description: "Ancient redwood forest just north of San Francisco",
    address: "1 Muir Woods Rd, Mill Valley, CA 94941",
    coordinates: `POINT(-122.5808 37.8974)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=redwood%20forest",
  },
  {
    id: uuidv4(),
    name: "230 Fifth Rooftop",
    description: "Rooftop bar with Empire State Building views",
    address: "230 5th Ave, New York, NY 10001",
    coordinates: `POINT(-73.9877 40.7441)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=rooftop%20bar%20nyc",
  },
  {
    id: uuidv4(),
    name: "The Strand Bookstore",
    description: "18 miles of books in Manhattan",
    address: "828 Broadway, New York, NY 10003",
    coordinates: `POINT(-73.9905 40.7335)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "/placeholder.svg?height=300&width=400&query=bookstore%20stacks",
  },
]

// List-place associations
const listPlacesAssociations = [
  // Seattle coffee list places (list index 0)
  { list_index: 0, place_indices: [0, 1, 2] },
  // Portland hidden gems list places (list index 1)
  { list_index: 1, place_indices: [3, 4] },
  // NYC Food Scene list places (list index 2)
  { list_index: 2, place_indices: [5, 6] },
  // Bay Area Hiking list places (list index 3)
  { list_index: 3, place_indices: [7, 8] },
  // Rooftop Bars list places (list index 4)
  { list_index: 4, place_indices: [9] },
  // Bookworm Paradise list places (list index 5)
  { list_index: 5, place_indices: [3, 10] }, // Powell's Books + The Strand
]

export async function GET() {
  try {
    // Insert users
    const { data: userData, error: userError } = await supabaseAdmin.from("users").insert(sampleUsers).select()

    if (userError) {
      console.error("Error inserting users:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Update lists with different user IDs for variety
    const listsWithOwner = sampleLists.map((list, index) => ({
      ...list,
      owner_id: userData[index % userData.length].id, // Distribute lists among users
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
      const listOwnerId = listsData[assoc.list_index].owner_id
      for (const placeIndex of assoc.place_indices) {
        listPlacesData.push({
          id: uuidv4(),
          list_id: listId,
          place_id: placesData[placeIndex].id,
          creator_id: listOwnerId, // Use the list owner as the creator
          created_at: new Date().toISOString(),
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
