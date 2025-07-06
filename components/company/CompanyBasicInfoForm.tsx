"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { Building2, Calendar, Users, FileText } from "lucide-react"
import { useUpdateCompanyProfileMutation } from "@/redux/features/management/companyProfileApiSlice"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGetCurrencyQuery } from '../../redux/features/common/typeOF';
import type { CompanyProfile, CompanyFormData } from "@/types/company-profile"
import { getCurrencySymbol } from "@/lib/currency-utils"

interface CompanyBasicInfoFormProps {
  profile: CompanyProfile | null
  onSuccess?: () => void
}

interface FormErrors {
  name?: string
  industry?: string
  currency:string
  description?: string
  founded_date?: string
  employees_count?: string
  tax_id?: string
  website?: string
  phone?: string
  email?: string
}

const INDUSTRY_OPTIONS: SelectOption[] = [
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Retail", label: "Retail" },
  { value: "Wholesale", label: "Wholesale" },
  { value: "Logistics", label: "Logistics" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Food & Beverage", label: "Food & Beverage" },
  { value: "Technology", label: "Technology" },
  { value: "Construction", label: "Construction" },
  { value: "Pharmaceutical", label: "Pharmaceutical" },
  { value: "Automotive", label: "Automotive" },
  { value: "Other", label: "Other" },
]

export function CompanyBasicInfoForm({ profile, onSuccess }: CompanyBasicInfoFormProps) {
  const [updateProfile, { isLoading, isSuccess, isError, error, }] = useUpdateCompanyProfileMutation()
  const { data: currencies=[],isLoading:currencyLoading,error:currencyError } = useGetCurrencyQuery();

  const currencyOptions = currencies.map(currency => ({
  value: currency.code,
  label: `${getCurrencySymbol(currency.code)} ${currency.code} `
}));
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    industry: "",
    currency:'',
    description: "",
    founded_date: "",
    employees_count: undefined,
    tax_id: "",
    website: "",
    phone: "",
    email: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        industry: profile.industry || "",
        currency:profile?.currency,
        description: profile.description || "",
        founded_date: profile.founded_date || "",
        employees_count: profile.employees_count || undefined,
        tax_id: profile.tax_id || "",
        website: profile.website || "",
        phone: profile.phone || "",
        email: profile.email || "",
      })
    }
  }, [profile])

  useEffect(() => {
    if (isSuccess) {
      setShowSuccessMessage(true)
      if (onSuccess) onSuccess()

      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isSuccess, onSuccess])

  const updateFormData = (data: Partial<CompanyFormData>) => {
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

  const isValidEmail = (email: string): boolean => {
    if (!email) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name?.trim()) {
      newErrors.name = "Company name is required"
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid website URL"
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (formData.employees_count && formData.employees_count < 0) {
      newErrors.employees_count = "Employee count cannot be negative"
    }

    if (formData.founded_date) {
      const foundedDate = new Date(formData.founded_date)
      const currentDate = new Date()
      if (foundedDate > currentDate) {
        newErrors.founded_date = "Founded date cannot be in the future"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await updateProfile({ id:profile?.id, data: formData }).unwrap()
      onSuccess?.()
    } catch (err) {
      console.error("Failed to update company profile:", err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showSuccessMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">Company information updated successfully!</AlertDescription>
        </Alert>
      )}

      {isError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {error ? `Error: ${JSON.stringify(error)}` : "Failed to update company information. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Enter company name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <ReactSelectField
            options={INDUSTRY_OPTIONS}
            value={INDUSTRY_OPTIONS.find((option) => option.value === formData.industry) || null}
            onChange={(option) => {
              if (option && !Array.isArray(option)) {
                updateFormData({ industry: option?.value })
              } else {
                updateFormData({ industry: "" })
              }
            }}
            placeholder="Select industry"
            isSearchable
            isClearable
            error={errors.industry}
          />
          {errors.industry && <p className="text-red-500 text-sm">{errors.industry}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Operational Currency</Label>
          <ReactSelectField
            options={currencyOptions}
            value={currencyOptions.find((option) => option.value === formData.currency) || null}
            onChange={(option) => {
              if (option && !Array.isArray(option)) {
                updateFormData({ currency: option?.value })
              } else {
                updateFormData({ currency: undefined})
              }
            }}
            placeholder="Select currency"
            isSearchable
            isClearable
            error={errors.industry}
          />
          {errors.currency && <p className="text-red-500 text-sm">{errors.currency}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Briefly describe your company"
          rows={4}
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="founded_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Founded Date
          </Label>
          <Input
            id="founded_date"
            type="date"
            value={formData.founded_date}
            onChange={(e) => updateFormData({ founded_date: e.target.value })}
            className={errors.founded_date ? "border-red-500" : ""}
          />
          {errors.founded_date && <p className="text-red-500 text-sm">{errors.founded_date}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="employees_count" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Number of Employees
          </Label>
          <Input
            id="employees_count"
            type="number"
            min="0"
            value={formData.employees_count || ""}
            onChange={(e) =>
              updateFormData({ employees_count: e.target.value ? Number.parseInt(e.target.value) : undefined })
            }
            placeholder="Enter number of employees"
            className={errors.employees_count ? "border-red-500" : ""}
          />
          {errors.employees_count && <p className="text-red-500 text-sm">{errors.employees_count}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="tax_id">Tax ID/VAT Number</Label>
          <Input
            id="tax_id"
            value={formData.tax_id}
            onChange={(e) => updateFormData({ tax_id: e.target.value })}
            placeholder="Enter tax ID or VAT number"
            className={errors.tax_id ? "border-red-500" : ""}
          />
          {errors.tax_id && <p className="text-red-500 text-sm">{errors.tax_id}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
            placeholder="https://example.com"
            className={errors.website ? "border-red-500" : ""}
          />
          {errors.website && <p className="text-red-500 text-sm">{errors.website}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="Enter phone number"
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="contact@company.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading }>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
