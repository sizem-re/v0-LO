"use client"

import Link from "next/link"
import { SearchBar } from "./search-bar"

export function Header() {
  return (
    <header className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-serif text-4xl font-normal tracking-tighter">
          LO
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        <nav className="flex items-center gap-6 md:gap-8">
          <Link href="/lists/create" className="nav-link">
            CREATE LIST
          </Link>
          <Link href="/explore" className="nav-link">
            EXPLORE
          </Link>
          <Link href="/map" className="nav-link">
            MAP
          </Link>
        </nav>

        <SearchBar />
      </div>
    </header>
  )
}
