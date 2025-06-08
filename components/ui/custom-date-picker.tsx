"use client"

import { useState, useEffect } from "react"
import { format, isAfter, isBefore } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomDatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  error?: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disableFuture?: boolean
  disablePast?: boolean
  yearRange?: [number, number] // [startYear, endYear]
  initialFocusDate?: Date
  className?: string
}

export function CustomDatePicker({
  value,
  onChange,
  error,
  placeholder = "Select date",
  minDate,
  maxDate,
  disableFuture = false,
  disablePast = false,
  yearRange,
  initialFocusDate,
  className,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false)

  // Calculate default year range if not provided
  const defaultStartYear = minDate ? minDate.getFullYear() : 1900
  const defaultEndYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 10

  const [year, setYear] = useState<number>(() => {
    if (value) return value.getFullYear()
    if (initialFocusDate) return initialFocusDate.getFullYear()
    return new Date().getFullYear()
  })

  const [month, setMonth] = useState<number>(() => {
    if (value) return value.getMonth()
    if (initialFocusDate) return initialFocusDate.getMonth()
    return new Date().getMonth()
  })

  // Calculate actual year range to use
  const startYear = yearRange ? yearRange[0] : defaultStartYear
  const endYear = yearRange ? yearRange[1] : defaultEndYear

  // Generate array of years
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)

  // Generate array of month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Handle year change
  const handleYearChange = (value: string) => {
    setYear(Number.parseInt(value))
  }

  // Handle month change
  const handleMonthChange = (value: string) => {
    setMonth(Number.parseInt(value))
  }

  // Handle previous year
  const handlePrevYear = () => {
    if (year > startYear) {
      setYear(year - 1)
    }
  }

  // Handle next year
  const handleNextYear = () => {
    if (year < endYear) {
      setYear(year + 1)
    }
  }

  // Handle previous month
  const handlePrevMonth = () => {
    if (month === 0) {
      if (year > startYear) {
        setMonth(11)
        setYear(year - 1)
      }
    } else {
      setMonth(month - 1)
    }
  }

  // Handle next month
  const handleNextMonth = () => {
    if (month === 11) {
      if (year < endYear) {
        setMonth(0)
        setYear(year + 1)
      }
    } else {
      setMonth(month + 1)
    }
  }

  // Set default date when opening the picker
  useEffect(() => {
    if (open && !value && initialFocusDate) {
      setYear(initialFocusDate.getFullYear())
      setMonth(initialFocusDate.getMonth())
    }
  }, [open, value, initialFocusDate])

  // Check if a year/month combination is disabled
  const isYearMonthDisabled = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    if (minDate && isAfter(minDate, lastDayOfMonth)) return true
    if (maxDate && isBefore(maxDate, firstDayOfMonth)) return true

    return false
  }

  // Check if previous year button should be disabled
  const isPrevYearDisabled = () => {
    return year <= startYear
  }

  // Check if next year button should be disabled
  const isNextYearDisabled = () => {
    return year >= endYear
  }

  // Check if previous month button should be disabled
  const isPrevMonthDisabled = () => {
    if (year === startYear && month === 0) return true
    return isYearMonthDisabled(year, month - 1 < 0 ? 11 : month - 1)
  }

  // Check if next month button should be disabled
  const isNextMonthDisabled = () => {
    if (year === endYear && month === 11) return true
    return isYearMonthDisabled(year, month + 1 > 11 ? 0 : month + 1)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            error && "border-red-500",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex justify-between items-center mb-2">
            <button
              type="button"
              onClick={handlePrevYear}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPrevYearDisabled()}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={year.toString()} />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years?.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={handleNextYear}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isNextYearDisabled()}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPrevMonthDisabled()}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <Select value={month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={months[month]} />
              </SelectTrigger>
              <SelectContent>
                {months?.map((m, i) => (
                  <SelectItem key={m} value={i.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isNextMonthDisabled()}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          month={new Date(year, month)}
          onMonthChange={(date) => {
            setMonth(date.getMonth())
            setYear(date.getFullYear())
          }}
          disabled={(date) => {
            // Disable future dates if specified
            if (disableFuture && isAfter(date, new Date())) return true

            // Disable past dates if specified
            if (disablePast && isBefore(date, new Date())) return true

            // Respect min date if provided
            if (minDate && isBefore(date, minDate)) return true

            // Respect max date if provided
            if (maxDate && isAfter(date, maxDate)) return true

            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
