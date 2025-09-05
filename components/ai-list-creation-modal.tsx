"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, Upload, Link2, Sparkles, ImageIcon, Loader2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"

type InputMethod = "natural" | "photo" | "link" | "manual"
type ListPrivacy = "private" | "public" | "community"

interface AIListCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onListCreated?: (list: { id: string; title: string; description?: string }) => void
}

interface AIAnalysisResult {
  title: string
  description: string
  suggestedPrivacy: ListPrivacy
  confidence: number
}

export function AIListCreationModal({ isOpen, onClose, onListCreated }: AIListCreationModalProps) {
  const { dbUser } = useAuth()
  const [currentMethod, setCurrentMethod] = useState<InputMethod>("natural")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI Analysis state
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [showAiResult, setShowAiResult] = useState(false)

  // Input states
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [linkInput, setLinkInput] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Manual form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "private" as ListPrivacy,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const resetForm = () => {
    setCurrentMethod("natural")
    setNaturalLanguageInput("")
    setLinkInput("")
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormData({ title: "", description: "", visibility: "private" })
    setAiResult(null)
    setShowAiResult(false)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const processWithAI = async () => {
    if (!dbUser?.id) {
      setError("You must be logged in to create a list")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      let analysisData: any = {}

      if (currentMethod === "natural" && naturalLanguageInput.trim()) {
        analysisData = { text: naturalLanguageInput.trim(), type: "natural_language" }
      } else if (currentMethod === "link" && linkInput.trim()) {
        analysisData = { url: linkInput.trim(), type: "link" }
      } else if (currentMethod === "photo" && photoFile) {
        // Convert photo to base64 for API
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(photoFile)
        })
        analysisData = { image: base64, type: "photo" }
      } else {
        setError("Please provide input for AI analysis")
        return
      }

      // TODO: Replace with actual AI API endpoint
      // Simulating AI analysis for now
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockResult: AIAnalysisResult = {
        title:
          currentMethod === "natural"
            ? "My Favorite Coffee Shops"
            : currentMethod === "link"
              ? "Bookmarked Places"
              : "Photo Collection",
        description:
          currentMethod === "natural"
            ? "A curated list of cozy coffee shops perfect for working and relaxing"
            : currentMethod === "link"
              ? "Places I've discovered and want to remember"
              : "Places captured in photos that hold special memories",
        suggestedPrivacy: "private",
        confidence: 0.85,
      }

      setAiResult(mockResult)
      setFormData({
        title: mockResult.title,
        description: mockResult.description,
        visibility: mockResult.suggestedPrivacy,
      })
      setShowAiResult(true)
    } catch (err) {
      console.error("AI processing error:", err)
      setError("Failed to process with AI. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Title is required")
      return
    }

    if (!dbUser?.id) {
      setError("You must be logged in to create a list")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
          ownerId: dbUser.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create list")
      }

      const newList = await response.json()

      if (onListCreated) {
        onListCreated({
          id: newList.id,
          title: newList.title,
          description: newList.description,
        })
      }

      toast({
        title: "List created",
        description: `${newList.title} has been created successfully.`,
      })

      resetForm()
      onClose()
    } catch (err) {
      console.error("Error creating list:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderInputMethod = () => {
    switch (currentMethod) {
      case "natural":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="natural-input" className="text-sm font-medium text-foreground">
                Describe your list in natural language
              </Label>
              <div className="ai-input-area mt-2">
                <Textarea
                  id="natural-input"
                  placeholder="e.g., I want to create a list of cozy coffee shops in Brooklyn where I can work on my laptop..."
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  rows={4}
                  className="border-0 bg-transparent resize-none focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )

      case "photo":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Upload a photo to analyze</Label>
              <div
                className="ai-input-area mt-2 cursor-pointer hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-4" />
                    <p className="text-sm">Click to upload a photo</p>
                    <p className="text-xs mt-1">AI will analyze the image to suggest list details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case "link":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-input" className="text-sm font-medium text-foreground">
                Paste a link to analyze
              </Label>
              <div className="ai-input-area mt-2">
                <div className="flex items-center space-x-3">
                  <Link2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    id="link-input"
                    type="url"
                    placeholder="https://example.com/my-favorite-places"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="border-0 bg-transparent focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case "manual":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                List Title*
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., My Favorite Coffee Shops"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-foreground">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="What's this list about?"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
        )
    }
  }

  const renderPrivacyOptions = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Privacy Settings</Label>
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "private", label: "Private", desc: "Sharable via link", icon: "🔒" },
          { value: "public", label: "Public", desc: "Anyone can see", icon: "🌍" },
          { value: "community", label: "Community", desc: "Others can add", icon: "👥" },
        ].map((option) => (
          <label
            key={option.value}
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              formData.visibility === option.value
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={formData.visibility === option.value}
              onChange={(e) => setFormData((prev) => ({ ...prev, visibility: e.target.value as ListPrivacy }))}
              className="sr-only"
            />
            <div className="text-center">
              <div className="text-lg mb-1">{option.icon}</div>
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[5vh]">
      <div className="ai-modal w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-serif text-foreground">Create List with AI</h2>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Method Selection */}
          {!showAiResult && (
            <div className="space-y-4">
              <Label className="text-sm font-medium text-foreground">How would you like to create your list?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { method: "natural" as InputMethod, icon: ImageIcon, label: "Describe" },
                  { method: "photo" as InputMethod, icon: ImageIcon, label: "Photo" },
                  { method: "link" as InputMethod, icon: ImageIcon, label: "Link" },
                  { method: "manual" as InputMethod, icon: ImageIcon, label: "Manual" },
                ].map(({ method, icon: Icon, label }) => (
                  <button
                    key={method}
                    onClick={() => setCurrentMethod(method)}
                    className={`p-4 rounded-lg border transition-all ${
                      currentMethod === method
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Method */}
          {!showAiResult && renderInputMethod()}

          {/* AI Result */}
          {showAiResult && aiResult && (
            <div className="space-y-6">
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Check className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-accent">AI Analysis Complete</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(aiResult.confidence * 100)}% confidence)
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Suggested Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Suggested Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {renderPrivacyOptions()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-between">
          <Button variant="outline" onClick={handleClose} className="px-6 bg-transparent">
            Cancel
          </Button>

          <div className="flex space-x-3">
            {!showAiResult && currentMethod !== "manual" && (
              <Button
                onClick={processWithAI}
                disabled={
                  isProcessing ||
                  (currentMethod === "natural" && !naturalLanguageInput.trim()) ||
                  (currentMethod === "link" && !linkInput.trim()) ||
                  (currentMethod === "photo" && !photoFile)
                }
                className="ai-button-primary px-6"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            )}

            {(showAiResult || currentMethod === "manual") && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title.trim()}
                className="ai-button-primary px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create List"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
