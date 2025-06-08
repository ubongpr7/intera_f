"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"
import type { CompanyProfile,CompanyAddress } from "types/company-profile"

interface CompanyAddressFormProps {
  profile: CompanyProfile | null
  onUpdate: (data: any) => Promise<any>
  
}

interface FormErrors {
  street_address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "AU", label: "Australia" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "IN", label: "India" },
  { value: "BR", label: "Brazil" },
]

export function CompanyAddressForm({ profile, onUpdate,  }: CompanyAddressFormProps) {
  const [formData, setFormData] = useState<CompanyAddress>({
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (profile?.headquarters_address) {
      setFormData({
        street_address: profile.headquarters_address.street_address || "",
        city: profile.headquarters_address.city || "",
        state: profile.headquarters_address.state || "",
        postal_code: profile.headquarters_address.postal_code || "",
        country: profile.headquarters_address.country || "",
      })
    }
  }, [profile])

  const updateFormData = (data: Partial<CompanyAddress>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (formData.street_address && !formData.city) {
      newErrors.city = "City is required when address is provided"
    }

    if (formData.street_address && !formData.country) {
      newErrors.country = "Country is required when address is provided"
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
      await onUpdate({
        headquarters_address: formData,
      })
    } catch (error) {
      console.error("Failed to update company address:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium">Headquarters Address</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street_address">Street Address</Label>
          <Input
            id="street_address"
            value={formData.street_address}
            onChange={(e) => updateFormData({ street_address: e.target.value })}
            placeholder="Enter street address"
            className={errors.street_address ? "border-red-500" : ""}
          />
          {errors.street_address && <p className="text-red-500 text-sm">{errors.street_address}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateFormData({ city: e.target.value })}
              placeholder="Enter city"
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => updateFormData({ state: e.target.value })}
              placeholder="Enter state or province"
              className={errors.state ? "border-red-500" : ""}
            />
            {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => updateFormData({ postal_code: e.target.value })}
              placeholder="Enter postal code"
              className={errors.postal_code ? "border-red-500" : ""}
            />
            {errors.postal_code && <p className="text-red-500 text-sm">{errors.postal_code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={formData.country} onValueChange={(value) => updateFormData({ country: value })}>
              <SelectTrigger className={errors.country ? "border-red-500" : ""}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Address"}
        </Button>
      </div>
    </form>
  )
}
