"use client"

import { Plus, ListIcon, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateGuidanceProps {
  onCreateList: () => void
  title?: string
  description?: string
}

export function EmptyStateGuidance({ 
  onCreateList, 
  title = "Create Your First List",
  description = "Lists help you organize places by theme, trip, or any way you like. Start by creating your first list, then add places to it."
}: EmptyStateGuidanceProps) {
  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="flex items-center gap-2 mb-4">
          <ListIcon className="h-8 w-8 text-gray-400" />
          <MapPin className="h-6 w-6 text-gray-300" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md">{description}</p>
        
        <div className="space-y-3">
          <Button 
            onClick={onCreateList}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First List
          </Button>
          
          <div className="text-xs text-gray-500">
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Create List
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Add Places
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Share & Explore
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 