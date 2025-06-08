"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Linkedin, Twitter, Instagram, Facebook, Link2 } from "lucide-react"
import type { CompanyProfile } from "types/company-profile"

interface CompanySocialLinksFormProps {
  profile: CompanyProfile | null
  onUpdate: (data: any) => Promise<any>
  
}

interface SocialLinksData {
  linkedin?: string
  twitter?: string
  instagram?: string
  facebook?: string
  other_link?: string
}

interface FormErrors {
  linkedin?: string
  twitter?: string
  instagram?: string
  facebook?: string
  other_link?: string
}

export function CompanySocialLinksForm({ profile, onUpdate,  }: CompanySocialLinksFormProps) {
  const [formData, setFormData] = useState<SocialLinksData>({
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
    other_link: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        linkedin: profile.linkedin || "",
        twitter: profile.twitter || "",
        instagram: profile.instagram || "",
        facebook: profile.facebook || "",
        other_link: profile.other_link || "",
      })
    }
  }, [profile])

  const updateFormData = (data: Partial<SocialLinksData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const isValidUrl = (url: string): boolean => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (formData.linkedin && !isValidUrl(formData.linkedin)) {
      newErrors.linkedin = "Please enter a valid LinkedIn URL"
    }

    if (formData.twitter && !isValidUrl(formData.twitter)) {
      newErrors.twitter = "Please enter a valid Twitter URL"
    }

    if (formData.instagram && !isValidUrl(formData.instagram)) {
      newErrors.instagram = "Please enter a valid Instagram URL"
    }

    if (formData.facebook && !isValidUrl(formData.facebook)) {
      newErrors.facebook = "Please enter a valid Facebook URL"
    }

    if (formData.other_link && !isValidUrl(formData.other_link)) {
      newErrors.other_link = "Please enter a valid URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onUpdate(formData)
    } catch (error) {
      console.error("Failed to update social links:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium">Social Media & Links</h3>
          <span className="text-sm text-muted-foreground">(All optional)</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-blue-600" />
            LinkedIn Profile
          </Label>
          <Input
            id="linkedin"
            type="url"
            value={formData.linkedin}
            onChange={(e) => updateFormData({ linkedin: e.target.value })}
            placeholder="https://linkedin.com/company/yourcompany"
            className={errors.linkedin ? "border-red-500" : ""}
          />
          {errors.linkedin && <p className="text-red-500 text-sm">{errors.linkedin}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4 text-blue-400" />
            Twitter Profile
          </Label>
          <Input
            id="twitter"
            type="url"
            value={formData.twitter}
            onChange={(e) => updateFormData({ twitter: e.target.value })}
            placeholder="https://twitter.com/yourcompany"
            className={errors.twitter ? "border-red-500" : ""}
          />
          {errors.twitter && <p className="text-red-500 text-sm">{errors.twitter}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-pink-600" />
            Instagram Profile
          </Label>
          <Input
            id="instagram"
            type="url"
            value={formData.instagram}
            onChange={(e) => updateFormData({ instagram: e.target.value })}
            placeholder="https://instagram.com/yourcompany"
            className={errors.instagram ? "border-red-500" : ""}
          />
          {errors.instagram && <p className="text-red-500 text-sm">{errors.instagram}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-700" />
            Facebook Profile
          </Label>
          <Input
            id="facebook"
            type="url"
            value={formData.facebook}
            onChange={(e) => updateFormData({ facebook: e.target.value })}
            placeholder="https://facebook.com/yourcompany"
            className={errors.facebook ? "border-red-500" : ""}
          />
          {errors.facebook && <p className="text-red-500 text-sm">{errors.facebook}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="other_link" className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-gray-600" />
            Other Link/Website
          </Label>
          <Input
            id="other_link"
            type="url"
            value={formData.other_link}
            onChange={(e) => updateFormData({ other_link: e.target.value })}
            placeholder="https://example.com"
            className={errors.other_link ? "border-red-500" : ""}
          />
          {errors.other_link && <p className="text-red-500 text-sm">{errors.other_link}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Social Links"}
        </Button>
      </div>
    </form>
  )
}
