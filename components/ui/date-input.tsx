"use client"

import type React from "react"

import { forwardRef } from "react"
import { format, parse } from "date-fns"
import { cn } from "@/lib/utils"

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  error?: string
  label?: string
  helperText?: string
  minDate?: Date
  maxDate?: Date
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, error, label, helperText, className, minDate, maxDate, id, ...props }, ref) => {
    // Convert Date to string format for input
    const dateString = value ? format(value, "yyyy-MM-dd") : ""

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (!val) {
        onChange(undefined)
        return
      }

      try {
        // Parse the date string to a Date object
        const date = parse(val, "yyyy-MM-dd", new Date())
        onChange(date)
      } catch (error) {
      }
    }

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          
          <input
            ref={ref}
            id={id}
            type="date"
            className={cn(
              "block w-full pl-10 py-2 px-3 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              error ? "border-red-500" : "border-gray-300",
              className,
            )}
            value={dateString}
            onChange={handleChange}
            min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
            max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <p className={cn("text-xs", error ? "text-red-500" : "text-gray-500")}>{error || helperText}</p>
        )}
      </div>
    )
  },
)

DateInput.displayName = "DateInput"
