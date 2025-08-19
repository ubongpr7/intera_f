"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, ChevronLeft } from "lucide-react"

interface ExtraCollabProps {
  data: any
  onResponse: (response: any) => void
  compact?: boolean
  disabled?: boolean
}

export function ConditionalFormHandler({ data, onResponse, compact = false, disabled = false }: ExtraCollabProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [visibleFields, setVisibleFields] = useState<string[]>([])

  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, any> = {}
    data.fields.forEach((field: any) => {
      if (field.type === 'checkbox' || field.type === 'boolean') {
        initialData[field.name] = false
      } else {
        initialData[field.name] = ''
      }
    })
    setFormData(initialData)
    
    // Set initial visible fields (first step fields)
    const initialVisible = data.fields
      .filter((field: any) => !data.conditions.some((cond: any) => cond.show.includes(field.name)))
      .map((field: any) => field.name)
    setVisibleFields(initialVisible)
  }, [data])

  // Update visible fields when form data changes
  useEffect(() => {
    let newVisibleFields = [...visibleFields]
    
    // Process conditions to determine next steps
    data.conditions.forEach((condition: any) => {
      const fieldName = condition.if.field
      const expectedValue = condition.if.equals
      
      if (formData[fieldName] === expectedValue) {
        // Add fields to show
        condition.show.forEach((field: string) => {
          if (!newVisibleFields.includes(field)) {
            newVisibleFields.push(field)
          }
        })
      }
    })
    
    setVisibleFields(newVisibleFields)
  }, [formData, data.conditions])

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Move to next step if this field triggers new fields
    const condition = data.conditions.find((cond: any) => 
      cond.if.field === fieldName && cond.if.equals === value
    )
    
    if (condition) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    onResponse({
      type: "conditional_form_response",
      form_data: formData
    })
  }

  const renderField = (field: any) => {
    if (!visibleFields.includes(field.name)) return null

    return (
      <div key={field.name} className="mb-4">
        {field.type !== "checkbox" && field.type !== "boolean" && (
          <label className={`block font-medium mb-1 ${compact ? "text-xs" : "text-sm"}`}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {field.type === "text" && (
          <Input
            value={formData[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            size={compact ? "sm" : "default"}
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            value={formData[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={compact ? 2 : 3}
            className={compact ? "text-xs" : "text-sm"}
          />
        )}

        {field.type === "select" && (
          <select
            value={formData[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={`w-full border rounded px-3 py-2 ${compact ? "text-xs" : "text-sm"}`}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option: any, optIndex: number) => (
              <option key={optIndex} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {(field.type === "checkbox" || field.type === "boolean") && (
          <div className="flex items-center gap-3 p-2 border rounded-lg bg-white">
            <input
              type="checkbox"
              id={`field-${field.name}`}
              checked={formData[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor={`field-${field.name}`}
              className={`font-medium cursor-pointer ${compact ? "text-xs" : "text-sm"}`}
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        )}
      </div>
    )
  }

  // Get fields for current step
  const currentStepFields = data.fields.filter((field: any) => 
    visibleFields.includes(field.name) && 
    (!field.step || field.step <= currentStep)
  )

  // Check if we're ready to show the submit button
  const showSubmitButton = visibleFields.length > 0 && 
    currentStepFields.length === visibleFields.length

  return (
    <Card className={`${compact ? "text-sm" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
          <CheckCircle className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {data.title}
        </CardTitle>
        <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.description}</p>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-4">
          {/* Step indicator */}
          {data.conditions.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {currentStep > 0 && (
                  <Button 
                    onClick={handlePrevious}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
              <span className={`text-xs text-gray-500 ${compact ? "text-xs" : "text-sm"}`}>
                Step {currentStep + 1}
              </span>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            {currentStepFields.map(renderField)}
          </div>

          {showSubmitButton ? (
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size={compact ? "sm" : "default"}
            >
              Submit Form
            </Button>
          ) : (
            <div className="text-center text-gray-500 text-sm">
              Please complete the current step to continue
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}