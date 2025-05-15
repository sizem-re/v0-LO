type UserStatsProps = {
  user: {
    lists: number
    places: number
    followers: number
  }
}

export function UserStats({ user }: UserStatsProps) {
  return (
    <div className="grid grid-cols-3 w-full border-t border-b border-black py-4">
      <div className="text-center">
        <div className="font-bold">{user.lists}</div>
        <div className="text-xs">LISTS</div>
      </div>
      <div className="text-center border-l border-r border-black">
        <div className="font-bold">{user.places}</div>
        <div className="text-xs">PLACES</div>
      </div>
      <div className="text-center">
        <div className="font-bold">{user.followers}</div>
        <div className="text-xs">FOLLOWERS</div>
      </div>
    </div>
  )
}
