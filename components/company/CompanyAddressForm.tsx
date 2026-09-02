"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { MapPin } from "lucide-react"
import {
  useListSharedCountriesQuery,
  useListSharedRegionsQuery,
  useListSharedSubregionsQuery,
  useListSharedCitiesQuery,
} from "@/redux/features/locations/locationsApiSlice"

import {
  useCreateCompanyProfileAddressMutation,
  useUpdateCompanyProfileAddressMutation,
} from "@/redux/features/management/companyProfileApiSlice"
import { useCreateSharedAddressMutation, useUpdateSharedAddressMutation } from "@/redux/features/locations/locationsApiSlice"
import { Address } from "@/redux/features/common/commonTypes"
import { CompanyProfile } from "@/redux/features/management/companyProfileTypes"
import { extractErrorMessage } from "@/lib/utils"
import { toast } from "react-toastify"



// interface CompanyProfile {
//   id?: number
//   name?: string
//   headquarters_address?: Address
//   // Add other fields as needed
// }

interface CompanyAddressFormProps {
  profile: CompanyProfile | null
  onUpdate: () => Promise<any> | void
  submitLabel?: string
}

interface FormErrors {
  country?: string
  region?: string
  subregion?: string
  city?: string
  street?: string
  postal_code?: string
}

export function CompanyAddressForm({ profile, onUpdate, submitLabel = "Save Address" }: CompanyAddressFormProps) {
  const getSingleOption = (option: SelectOption | readonly SelectOption[] | null): SelectOption | null => {
    if (Array.isArray(option)) {
      return null;
    }
    return option as SelectOption | null;
  };

  const [formData, setFormData] = useState<Address>({
    country: null,
    region: null,
    subregion: null,
    city: null,
    apt_number: null,
    street_number: null,
    street: null,
    postal_code: null,
    full_address: null,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const [createCompanyProfileAddress] = useCreateCompanyProfileAddressMutation()
  const [updateCompanyProfileAddress] = useUpdateCompanyProfileAddressMutation()
  const [createSharedAddress, { isLoading: isLoadingAddAddress }] = useCreateSharedAddressMutation()
  const [updateSharedAddress, { isLoading: isLoadingUpdateAddress }] = useUpdateSharedAddressMutation()

  // Memoize loading state
  const isAddressLoading = useMemo(() => isLoadingAddAddress || isLoadingUpdateAddress, [isLoadingAddAddress, isLoadingUpdateAddress])

  // Fetch cascading data
  const { data: countries, isLoading: isLoadingCountries } = useListSharedCountriesQuery()
  const { data: regions, isLoading: isLoadingRegions } = useListSharedRegionsQuery(
    { country_id: formData.country || undefined },
    {
    skip: !formData.country,
    },
  )
  const { data: subregions, isLoading: isLoadingSubregions } = useListSharedSubregionsQuery(
    { region_id: formData.region || undefined },
    {
    skip: !formData.region,
    },
  )
  const { data: cities, isLoading: isLoadingCities } = useListSharedCitiesQuery(
    {
      region_id: formData.region || undefined,
      subregion_id: formData.subregion || undefined,
    },
    {
    skip: !formData.subregion,
    },
  )

  // Memoize options
  const countryOptions: SelectOption[] = useMemo(
    () =>
      countries
        ? countries.map((country) => ({
            value: country.id.toString(),
            label: country.name,
          }))
        : [],
    [countries]
  )

  const regionOptions: SelectOption[] = useMemo(
    () =>
      regions
        ? regions.map((region) => ({
            value: region.id.toString(),
            label: region.name,
          }))
        : [],
    [regions]
  )

  const subregionOptions: SelectOption[] = useMemo(
    () =>
      subregions
        ? subregions.map((subregion) => ({
            value: subregion.id.toString(),
            label: subregion.name,
          }))
        : [],
    [subregions]
  )

  const cityOptions: SelectOption[] = useMemo(
    () =>
      cities
        ? cities.map((city) => ({
            value: city.id.toString(),
            label: city.name,
          }))
        : [],
    [cities]
  )

  // Dynamic placeholders
  const getPlaceholder = useCallback(
    (field: string, loading: boolean, dependency?: number | null) => {
      if (loading) return `Loading ${field}s...`
      if (!dependency && field !== "country") return `Select ${field === "region" ? "country" : field === "subregion" ? "region" : "subregion"} first`
      return `Select ${field}`
    },
    []
  )

  // Load previous data
  useEffect(() => {
    if (profile?.headquarters_address) {
      setFormData({
        country: profile.headquarters_address.country || null,
        region: profile.headquarters_address.region || null,
        subregion: profile.headquarters_address.subregion || null,
        city: profile.headquarters_address.city || null,
        apt_number: profile.headquarters_address.apt_number || null,
        street_number: profile.headquarters_address.street_number || null,
        street: profile.headquarters_address.street || null,
        postal_code: profile.headquarters_address.postal_code || null,
        full_address: profile.headquarters_address.full_address || null,
      })
      return
    }

    setFormData({
      country: null,
      region: null,
      subregion: null,
      city: null,
      apt_number: null,
      street_number: null,
      street: null,
      postal_code: null,
      full_address: null,
    })
  }, [profile])

  // Update form data
  const updateFormData = useCallback((data: Partial<Address>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }, [])

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.country) newErrors.country = "Country is required"
    if (!formData.region) newErrors.region = "Region/State is required"
    if (!formData.subregion) newErrors.subregion = "Subregion/LGA is required"
    if (!formData.city) newErrors.city = "City/Town is required"
    if (!formData.street?.trim()) newErrors.street = "Street is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      if (!profile?.id) {
        throw new Error("Save the company profile before adding a headquarters address.")
      }

      const addressLine = [formData.street_number, formData.street].filter(Boolean).join(" ").trim()
      const sharedAddressData = {
        label: "headquarters",
        address_line_1: addressLine,
        postal_code: formData.postal_code || "",
        country: formData.country,
        region: formData.region,
        subregion: formData.subregion,
        city: formData.city,
        is_primary: true,
        external_reference: `users:company-profile:${profile.id}:headquarters`,
      }
      const sharedAddress = profile.headquarters_address_id
        ? await updateSharedAddress({ id: profile.headquarters_address_id, data: sharedAddressData }).unwrap()
        : await createSharedAddress(sharedAddressData).unwrap()

      const legacyAddressData = { ...formData, shared_address_id: sharedAddress.id }
      if (profile.headquarters_address?.id) {
        await updateCompanyProfileAddress({
          id: String(profile.headquarters_address.id),
          data: legacyAddressData,
        }).unwrap()
      } else {
        await createCompanyProfileAddress(legacyAddressData).unwrap()
      }
      await onUpdate()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["street", "city", "detail"]))
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <ReactSelectField
              options={countryOptions}
              value={countryOptions.find((option) => option.value === formData.country?.toString())}
              onChange={(option) => {
                const nextOption = getSingleOption(option);
                updateFormData({ country: nextOption ? Number(nextOption.value) : null });
              }}
              placeholder={getPlaceholder("country", isLoadingCountries)}
              isDisabled={isLoadingCountries}
              error={errors.country}
              isSearchable
              isClearable
            />
            {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region/State</Label>
            <ReactSelectField
              options={regionOptions}
              value={regionOptions.find((option) => option.value === formData.region?.toString())}
              onChange={(option) => {
                const nextOption = getSingleOption(option);
                updateFormData({ region: nextOption ? Number(nextOption.value) : null });
              }}
              placeholder={getPlaceholder("region", isLoadingRegions, formData.country)}
              isDisabled={isLoadingRegions || !formData.country}
              error={errors.region}
              isSearchable
              isClearable
            />
            {errors.region && <p className="text-red-500 text-sm">{errors.region}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subregion">Subregion/LGA</Label>
            <ReactSelectField
              options={subregionOptions}
              value={subregionOptions.find((option) => option.value === formData.subregion?.toString())}
              onChange={(option) => {
                const nextOption = getSingleOption(option);
                updateFormData({ subregion: nextOption ? Number(nextOption.value) : null });
              }}
              placeholder={getPlaceholder("subregion", isLoadingSubregions, formData.region)}
              isDisabled={isLoadingSubregions || !formData.region}
              error={errors.subregion}
              isSearchable
              isClearable
            />
            {errors.subregion && <p className="text-red-500 text-sm">{errors.subregion}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City/Town</Label>
            <ReactSelectField
              options={cityOptions}
              value={cityOptions.find((option) => option.value === formData.city?.toString())}
              onChange={(option) => {
                const nextOption = getSingleOption(option);
                updateFormData({ city: nextOption ? Number(nextOption.value) : null });
              }}
              placeholder={getPlaceholder("city", isLoadingCities, formData.subregion)}
              isDisabled={isLoadingCities || !formData.subregion}
              error={errors.city}
              isSearchable
              isClearable
            />
            {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="street_number">Street Number</Label>
            <Input
              id="street_number"
              type="number"
              value={formData.street_number?.toString() || ""}
              onChange={(e) => updateFormData({ street_number: e.target.value ? Number(e.target.value) : null })}
              placeholder="Enter street number (optional)"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt_number">Apartment Number</Label>
            <Input
              id="apt_number"
              type="number"
              value={formData.apt_number?.toString() || ""}
              onChange={(e) => updateFormData({ apt_number: e.target.value ? Number(e.target.value) : null })}
              placeholder="Enter apartment number (optional)"
              min="0"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Street Name</Label>
            <Input
              id="street"
              value={formData.street || ""}
              onChange={(e) => updateFormData({ street: e.target.value })}
              placeholder="Enter street name"
              className={errors.street ? "border-red-500" : ""}
            />
            {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={formData.postal_code || ""}
              onChange={(e) => updateFormData({ postal_code: e.target.value })}
              placeholder="Enter postal code (optional)"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading || isAddressLoading}>
          {isLoading || isAddressLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
