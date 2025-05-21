import type React from "react"
import type { Metadata } from "next"
import { Inter, BIZ_UDMincho } from "next/font/google"
import "./globals.css"
import { NeynarProviderWrapper } from "@/components/neynar-provider-wrapper"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const bizUDMincho = BIZ_UDMincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-biz-udmincho",
})

export const metadata: Metadata = {
  title: "LO - Discover and share places that matter",
  description: "Discover and share places that matter",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bizUDMincho.variable} font-sans`}>
        <NeynarProviderWrapper>
          <AuthProvider>{children}</AuthProvider>
        </NeynarProviderWrapper>
      </body>
    </html>
  )
}
