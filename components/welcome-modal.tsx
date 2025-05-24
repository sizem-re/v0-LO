"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if the user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome")
    if (!hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    // Mark that the user has seen the welcome modal
    localStorage.setItem("hasSeenWelcome", "true")
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Welcome to LO</DialogTitle>
          <DialogDescription className="pt-2 text-base">
            Discover and share curated lists of locations, powered by the Farcaster community.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">
            LO helps you:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and share lists of your favorite places</li>
            <li>Discover new locations through community recommendations</li>
            <li>Connect with other location enthusiasts on Farcaster</li>
          </ul>
          <div className="mt-6 p-4 bg-yellow-50 rounded-sm">
            <p className="text-sm text-yellow-800">
              <strong>Beta Notice:</strong> LO is currently in beta. We're actively working on improvements and new features. Your feedback is valuable to us!
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 