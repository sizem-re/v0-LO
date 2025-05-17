"use client"

import { ChevronLeft, LogOut, MapPin, List } from "lucide-react"

interface ProfileViewProps {
  user: any
  onBack: () => void
  onLogout: () => void
}

export function ProfileView({ user, onBack, onLogout }: ProfileViewProps) {
  // Use Neynar user data if available
  const displayUser = user
    ? {
        displayName:
          typeof user.display_name === "string"
            ? user.display_name
            : typeof user.username === "string"
              ? user.username
              : "User",
        username: typeof user.username === "string" ? user.username : "user",
        pfp: user.pfp_url || "/placeholder.svg",
        fid: user.fid?.toString() || "0",
        bio: typeof user.profile?.bio === "string" ? user.profile.bio : "",
      }
    : {
        displayName: "Demo User",
        username: "demo_user",
        pfp: "/placeholder.svg",
        fid: "123456",
        bio: "This is a demo profile",
      }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <button
          className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded flex items-center"
          onClick={onLogout}
        >
          <LogOut size={16} className="mr-1" /> Logout
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 border border-black/10 rounded-full overflow-hidden">
            <img
              src={displayUser.pfp || "/placeholder.svg"}
              alt={displayUser.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-xl mb-1">{displayUser.displayName}</h2>
            <p className="text-black/70 text-sm">@{displayUser.username}</p>
            {displayUser.bio && <p className="text-sm mt-2">{displayUser.bio}</p>}
            <p className="text-xs text-black/60 mt-1">Farcaster ID: {displayUser.fid}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-black/10 p-4 rounded text-center">
            <div className="text-2xl font-medium">12</div>
            <div className="text-sm text-black/70">Lists</div>
          </div>
          <div className="border border-black/10 p-4 rounded text-center">
            <div className="text-2xl font-medium">48</div>
            <div className="text-sm text-black/70">Places</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-3 flex items-center">
            <List size={16} className="mr-2" /> Recent Lists
          </h3>
          <div className="space-y-2">
            <div className="p-3 border border-black/10 rounded">
              <h4 className="font-medium">BEST (HIDDEN) FOOD IN TACOMA</h4>
              <p className="text-xs text-black/60">12 places</p>
            </div>
            <div className="p-3 border border-black/10 rounded">
              <h4 className="font-medium">Weekend Getaways</h4>
              <p className="text-xs text-black/60">8 places</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3 flex items-center">
            <MapPin size={16} className="mr-2" /> Recent Places
          </h3>
          <div className="space-y-2">
            <div className="p-3 border border-black/10 rounded flex">
              <div
                className="h-10 w-10 bg-gray-200 rounded mr-3"
                style={{
                  backgroundImage: `url(/placeholder.svg?height=200&width=300)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div>
                <h4 className="font-medium">The Fish House Cafe</h4>
                <p className="text-xs text-black/60">Tacoma, WA</p>
              </div>
            </div>
            <div className="p-3 border border-black/10 rounded flex">
              <div
                className="h-10 w-10 bg-gray-200 rounded mr-3"
                style={{
                  backgroundImage: `url(/placeholder.svg?height=200&width=300)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div>
                <h4 className="font-medium">Lighthouse Coffee</h4>
                <p className="text-xs text-black/60">Beach Rd</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
