"use client"

import { useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Loader2, Check, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{
    success: boolean
    message: string
    data?: any
  } | null>(null)

  const handleSeedDatabase = async () => {
    try {
      setIsSeeding(true)
      setSeedResult(null)

      const response = await fetch("/api/seed")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed database")
      }

      setSeedResult({
        success: true,
        message: "Database seeded successfully!",
        data: data.data,
      })
    } catch (error) {
      console.error("Error seeding database:", error)
      setSeedResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif mb-8">Admin Tools</h1>

        <div className="bg-white border border-black/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-medium mb-4">Database Seeding</h2>
          <p className="mb-4 text-gray-600">
            This will populate your database with sample data for testing purposes. It will create:
          </p>
          <ul className="list-disc pl-5 mb-6 text-gray-600">
            <li>A sample user</li>
            <li>Two sample lists (Coffee Shops in Seattle, Hidden Gems in Portland)</li>
            <li>Five sample places</li>
            <li>Associations between lists and places</li>
          </ul>

          <div className="flex items-center gap-4">
            <Button onClick={handleSeedDatabase} disabled={isSeeding} className="bg-black text-white hover:bg-black/80">
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                "Seed Database"
              )}
            </Button>

            {seedResult && (
              <div className={`flex items-center gap-2 ${seedResult.success ? "text-green-600" : "text-red-600"}`}>
                {seedResult.success ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>{seedResult.message}</span>
              </div>
            )}
          </div>

          {seedResult && seedResult.success && seedResult.data && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Created Data:</h3>
              <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                {JSON.stringify(seedResult.data, null, 2)}
              </pre>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Test Links:</h3>
                <ul className="space-y-2">
                  {seedResult.data.lists &&
                    seedResult.data.lists.map((list: any) => (
                      <li key={list.id}>
                        <Link href={`/lists/${list.id}`} className="text-blue-600 hover:underline flex items-center">
                          View "{list.title}"
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">Testing Options</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">List Detail Page</h3>
              <p className="text-gray-600 mb-2">
                Test the list detail page with placeholder data (no database required):
              </p>
              <Link href="/lists/placeholder-test" className="text-blue-600 hover:underline">
                View Placeholder List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
