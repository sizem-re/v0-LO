"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AuthHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Farcaster Authentication Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Mobile Authentication Issues</h3>
              <p className="text-gray-600 mb-4">
                If you're having trouble connecting your Farcaster account on mobile, here are the most common issues and solutions:
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h4 className="font-semibold text-blue-900 mb-2">Problem: "Continue with LO" button doesn't appear</h4>
                <p className="text-sm text-blue-800 mb-2">This happens when the Neynar page doesn't load completely.</p>
                <p className="text-sm text-blue-800 font-medium">Solution: Refresh the Neynar page in your browser</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border">
                <h4 className="font-semibold text-amber-900 mb-2">Problem: "Continue with LO" button doesn't work</h4>
                <p className="text-sm text-amber-800 mb-2">Some mobile browsers have issues with the button functionality.</p>
                <p className="text-sm text-amber-800 font-medium">Solution: Manually return to the LO app using the link below</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border">
                <h4 className="font-semibold text-green-900 mb-2">Problem: Stuck on Neynar page after authorization</h4>
                <p className="text-sm text-green-800 mb-2">Sometimes the redirect back to LO doesn't work automatically.</p>
                <p className="text-sm text-green-800 font-medium">Solution: Use the manual return button below</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border">
                <h4 className="font-semibold text-purple-900 mb-2">Problem: Authentication seems to complete but you're not logged in</h4>
                <p className="text-sm text-purple-800 mb-2">This can happen if the authentication data doesn't get stored properly.</p>
                <p className="text-sm text-purple-800 font-medium">Solution: Try the authentication process again</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/" className="block">
                  <Button className="w-full" size="lg">
                    Return to LO App
                  </Button>
                </Link>
                
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    Try Authentication Again
                  </Button>
                </Link>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Step-by-Step Mobile Guide</h3>
              <ol className="space-y-2 text-sm">
                <li><strong>1.</strong> Click "Connect with Farcaster" on the LO app</li>
                <li><strong>2.</strong> You'll be redirected to Neynar (app.neynar.com)</li>
                <li><strong>3.</strong> Click "Connect with Farcaster" on the Neynar page</li>
                <li><strong>4.</strong> You'll be redirected to the Farcaster app or Warpcast</li>
                <li><strong>5.</strong> Authorize the connection in the Farcaster app</li>
                <li><strong>6.</strong> Return to your browser (you should be back on Neynar)</li>
                <li><strong>7.</strong> Look for a "Continue with LO" button</li>
                <li><strong>8.</strong> If the button doesn't appear, refresh the page</li>
                <li><strong>9.</strong> If the button doesn't work, return to this help page and click "Return to LO App"</li>
              </ol>
            </div>

            <div className="border-t pt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Still having issues? The authentication system is being improved to work better on mobile devices.
              </p>
              <p className="text-xs text-gray-500">
                You can bookmark this page for quick access: <code className="bg-gray-100 px-1 rounded">llllllo.com/auth/help</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 