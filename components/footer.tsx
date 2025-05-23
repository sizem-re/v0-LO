import Link from "next/link"
import { Instagram, Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-black/10 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-2xl">
              LO
            </Link>
            <p className="text-sm text-black/60 hidden md:block">Discover and share places that matter.</p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </Link>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link href="/about" className="hover:underline">
              ABOUT
            </Link>
            <Link href="/contact" className="hover:underline">
              CONTACT
            </Link>
            <Link href="/terms" className="hover:underline">
              TERMS
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
