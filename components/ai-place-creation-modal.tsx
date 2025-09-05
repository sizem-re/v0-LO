"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { X, Link2, Sparkles, ImageIcon, Loader2, Check, AlertCircle, MapPin, Camera, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"

type InputMethod = "natural" | "photo" | "link" | "manual"

interface List {
  id: string
  title: string
  visibility: string
  owner_id: string
}

interface AddressComponents {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface AIPlaceCreationModalProps {
  listId: string
  isOpen: boolean
  onClose: () => void
  onPlaceAdded: (place: any) => void
  onRefreshList?: () => void
}

interface AIPlaceAnalysisResult {
  name: string
  address: string
  coordinates: { lat: number; lng: number } | null
  website: string
  description: string
  confidence: number
  addressComponents: AddressComponents
}

export function AIPlaceCreationModal({
  listId,
  isOpen,
  onClose,
  onPlaceAdded,
  onRefreshList,
}: AIPlaceCreationModalProps) {
  const { dbUser } = useAuth()
  const [currentMethod, setCurrentMethod] = useState<InputMethod>("natural")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI Analysis state
  const [aiResult, setAiResult] = useState<AIPlaceAnalysisResult | null>(null)
  const [showAiResult, setShowAiResult] = useState(false)

  // Input states
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [linkInput, setLinkInput] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Place form state
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    note: "",
    coordinates: null as { lat: number; lng: number } | null,
    addressComponents: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    } as AddressComponents,
  })

  // List selection state
  const [selectedLists, setSelectedLists] = useState<string[]>([listId])
  const [userLists, setUserLists] = useState<List[]>([])
  const [currentList, setCurrentList] = useState<List | null>(null)
  const [isLoadingLists, setIsLoadingLists] = useState(true)
  const [isListDropdownOpen, setIsListDropdownOpen] = useState(false)
  const [listSearchQuery, setListSearchQuery] = useState("")
  const [filteredLists, setFilteredLists] = useState<List[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const listDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user's lists
  useEffect(() => {
    const fetchLists = async () => {
      if (!dbUser?.id) return

      try {
        setIsLoadingLists(true)
        const response = await fetch(`/api/lists?userId=${dbUser.id}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch lists: ${response.status}`)
        }

        const lists = await response.json()
        setUserLists(lists)

        const current = lists.find((list: List) => list.id === listId)
        if (current) {
          setCurrentList(current)
        }

        setFilteredLists(lists)
      } catch (err) {
        console.error("Error fetching lists:", err)
      } finally {
        setIsLoadingLists(false)
      }
    }

    fetchLists()
  }, [dbUser?.id, listId])

  // Filter lists based on search query
  useEffect(() => {
    if (!listSearchQuery.trim()) {
      setFilteredLists(userLists)
      return
    }

    const query = listSearchQuery.toLowerCase()
    const filtered = userLists.filter((list) => list.title.toLowerCase().includes(query))
    setFilteredLists(filtered)
  }, [listSearchQuery, userLists])

  // Handle clicks outside the list dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(event.target as Node)) {
        setIsListDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const resetForm = () => {
    setCurrentMethod("natural")
    setNaturalLanguageInput("")
    setLinkInput("")
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormData({
      name: "",
      website: "",
      note: "",
      coordinates: null,
      addressComponents: { street: "", city: "", state: "", postalCode: "", country: "" },
    })
    setSelectedLists([listId])
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
      setError("You must be logged in to create a place")
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

      const mockResult: AIPlaceAnalysisResult = {
        name:
          currentMethod === "natural"
            ? "Blue Bottle Coffee"
            : currentMethod === "link"
              ? "Extracted Place Name"
              : "Photo Location",
        address: "123 Main St, Brooklyn, NY 11201, USA",
        coordinates: { lat: 40.7128, lng: -74.006 },
        website: currentMethod === "link" ? linkInput : "https://bluebottlecoffee.com",
        description:
          currentMethod === "natural" ? naturalLanguageInput : "A great place discovered through AI analysis",
        confidence: 0.88,
        addressComponents: {
          street: "123 Main St",
          city: "Brooklyn",
          state: "NY",
          postalCode: "11201",
          country: "USA",
        },
      }

      setAiResult(mockResult)
      setFormData({
        name: mockResult.name,
        website: mockResult.website,
        note: mockResult.description,
        coordinates: mockResult.coordinates,
        addressComponents: mockResult.addressComponents,
      })
      setShowAiResult(true)
    } catch (err) {
      console.error("AI processing error:", err)
      setError("Failed to process with AI. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFullAddress = (): string => {
    const components = []
    const addr = formData.addressComponents

    if (addr.street) components.push(addr.street)
    if (addr.city) components.push(addr.city)
    if (addr.state) components.push(addr.state)
    if (addr.postalCode) components.push(addr.postalCode)
    if (addr.country) components.push(addr.country)

    return components.join(", ")
  }

  const handleToggleList = (listId: string) => {
    setSelectedLists((prev) => {
      if (prev.includes(listId)) {
        return prev.filter((id) => id !== listId)
      } else {
        return [...prev, listId]
      }
    })
  }

  const getListTitle = (id: string): string => {
    const list = userLists.find((l) => l.id === id)
    return list ? list.title : "Unknown List"
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.coordinates || selectedLists.length === 0) {
      setError("Please provide a name, valid address, and select at least one list.")
      return
    }

    if (!dbUser?.id) {
      setError("You must be logged in to create a place")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const fullAddress = formatFullAddress()

      // Format website URL if needed
      let formattedWebsite = formData.website
      if (formData.website && !formData.website.match(/^https?:\/\//)) {
        formattedWebsite = `https://${formData.website}`
      }

      // Check if place already exists
      const checkResponse = await fetch(`/api/places?lat=${formData.coordinates.lat}&lng=${formData.coordinates.lng}`)
      let placeId: string

      if (checkResponse.ok) {
        const existingPlaces = await checkResponse.json()

        if (existingPlaces.length > 0) {
          placeId = existingPlaces[0].id
        } else {
          // Create new place
          const createPlaceResponse = await fetch("/api/places", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.name,
              address: fullAddress,
              website_url: formattedWebsite,
              lat: formData.coordinates.lat,
              lng: formData.coordinates.lng,
              created_by: dbUser.id,
            }),
          })

          if (!createPlaceResponse.ok) {
            const errorData = await createPlaceResponse.json()
            throw new Error(errorData.error || "Failed to create place")
          }

          const newPlace = await createPlaceResponse.json()
          placeId = newPlace.id
        }

        // Add place to selected lists
        const addPromises = selectedLists.map(async (listId) => {
          const addToListResponse = await fetch("/api/list-places", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              list_id: listId,
              place_id: placeId,
              note: formData.note,
              added_by: dbUser.id,
            }),
          })

          if (!addToListResponse.ok) {
            const responseData = await addToListResponse.json()
            if (addToListResponse.status === 409) {
              return { error: true, duplicate: true, listId }
            }
            throw new Error(responseData.error || `Failed to add place to list ${listId}`)
          }

          return await addToListResponse.json()
        })

        const results = await Promise.all(addPromises)
        const successfulAdds = results.filter((result) => !result.error)

        if (successfulAdds.length > 0) {
          toast({
            title: "Place added",
            description:
              selectedLists.length === 1
                ? `${formData.name} has been added to ${getListTitle(selectedLists[0])}.`
                : `${formData.name} has been added to ${successfulAdds.length} lists.`,
          })

          onPlaceAdded({
            id: placeId,
            name: formData.name,
            address: fullAddress,
            website_url: formattedWebsite,
            coordinates: formData.coordinates,
            listPlaceId: successfulAdds[0].id,
          })

          resetForm()
          onClose()
        }
      }
    } catch (err) {
      console.error("Error creating place:", err)
      setError(err instanceof Error ? err.message : "Failed to create place")
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
                Describe the place you want to add
              </Label>
              <div className="ai-input-area mt-2">
                <Textarea
                  id="natural-input"
                  placeholder="e.g., There's this amazing coffee shop called Blue Bottle on Main Street in Brooklyn. They have great wifi and the best cortados..."
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
              <Label className="text-sm font-medium text-foreground">Upload a photo of the place</Label>
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
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-4" />
                    <p className="text-sm">Click to upload a photo</p>
                    <p className="text-xs mt-1">AI will analyze the image to extract place details</p>
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
                Paste a link to the place
              </Label>
              <div className="ai-input-area mt-2">
                <div className="flex items-center space-x-3">
                  <Link2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    id="link-input"
                    type="url"
                    placeholder="https://foursquare.com/venue/... or Google Maps link"
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
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Place Name*
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Blue Bottle Coffee"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-sm font-medium text-foreground">
                Website (Optional)
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">Address*</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                <Input
                  placeholder="Street address"
                  value={formData.addressComponents.street}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      addressComponents: { ...prev.addressComponents, street: e.target.value },
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="City"
                    value={formData.addressComponents.city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        addressComponents: { ...prev.addressComponents, city: e.target.value },
                      }))
                    }
                  />
                  <Input
                    placeholder="State/Province"
                    value={formData.addressComponents.state}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        addressComponents: { ...prev.addressComponents, state: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Postal Code"
                    value={formData.addressComponents.postalCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        addressComponents: { ...prev.addressComponents, postalCode: e.target.value },
                      }))
                    }
                  />
                  <Input
                    placeholder="Country"
                    value={formData.addressComponents.country}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        addressComponents: { ...prev.addressComponents, country: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  const renderListSelection = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Add to Lists*</Label>
      <div className="relative" ref={listDropdownRef}>
        <button
          type="button"
          className="w-full flex items-center justify-between p-3 border border-border rounded-lg bg-input hover:bg-muted/50 transition-colors"
          onClick={() => setIsListDropdownOpen(!isListDropdownOpen)}
        >
          <span className="text-sm">
            {selectedLists.length === 0
              ? "Select lists"
              : selectedLists.length === 1
                ? getListTitle(selectedLists[0])
                : `${selectedLists.length} lists selected`}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {isListDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg">
            <div className="p-2 border-b border-border">
              <Input
                type="text"
                placeholder="Search lists..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {isLoadingLists ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading lists...
                </div>
              ) : filteredLists.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No lists found</div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredLists.map((list) => (
                    <label key={list.id} className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLists.includes(list.id)}
                        onChange={() => handleToggleList(list.id)}
                        className="mr-3"
                      />
                      <span className="text-sm">{list.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[5vh]">
      <div className="ai-modal w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-serif text-foreground">Add Place with AI</h2>
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
              <Label className="text-sm font-medium text-foreground">How would you like to add this place?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { method: "natural" as InputMethod, icon: MapPin, label: "Describe" },
                  { method: "photo" as InputMethod, icon: Camera, label: "Photo" },
                  { method: "link" as InputMethod, icon: Link2, label: "Link" },
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
                    <Label className="text-sm font-medium text-foreground">Place Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Website</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Address</Label>
                    <div className="p-3 bg-muted rounded-md mt-1">
                      {formatFullAddress() || "No address provided"}
                      {formData.coordinates && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Note</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {renderListSelection()}
            </div>
          )}

          {/* Manual form list selection */}
          {currentMethod === "manual" && !showAiResult && renderListSelection()}
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
                disabled={isSubmitting || !formData.name.trim() || !formData.coordinates || selectedLists.length === 0}
                className="ai-button-primary px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Place"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
