import type { ReactNode } from "react"

export default function MapLayout({
  children,
}: {
  children: ReactNode
}) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>
}
