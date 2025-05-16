import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-serif mb-6">404 - Page Not Found</h1>
      <p className="mb-8">Sorry, the page you are looking for does not exist.</p>
      <Link href="/" className="lo-button">
        Return Home
      </Link>
    </div>
  )
}
