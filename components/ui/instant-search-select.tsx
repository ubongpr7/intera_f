// components/ui/instant-search-select.tsx
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface InstantSearchSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
  className?: string
  maxHeight?: number
}

export function InstantSearchSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
  className,
  maxHeight = 200,
}: InstantSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get the currently selected label
  const selectedLabel = useMemo(() => {
    return options.find(option => option.value === value)?.label || ""
  }, [value, options])

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  // Calculate dynamic height based on number of options
  const dynamicHeight = useMemo(() => {
    const itemHeight = 36
    const visibleItems = Math.min(filteredOptions?.length, 6)
    return Math.min(visibleItems * itemHeight, maxHeight)
  }, [filteredOptions?.length, maxHeight])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsSearching(false)
        setSearchTerm("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
    setIsSearching(false)
    setSearchTerm("")
  }

  const handleInputClick = () => {
    setIsOpen(true)
    if (!isSearching) {
      setIsSearching(true)
      setSearchTerm("")
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (!isOpen) setIsOpen(true)
  }

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      {/* Input that shows selected value when not searching */}
      <div onClick={handleInputClick}>
        <Input
          ref={inputRef}
          value={isSearching ? searchTerm : selectedLabel}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full cursor-pointer"
          readOnly={!isSearching}
        />
      </div>

      {/* Dropdown with search results */}
      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
          style={{ height: `${dynamicHeight}px` }}
        >
          <ScrollArea className="h-full">
            {filteredOptions?.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2 cursor-pointer ${
                  value === option.value ? "bg-gray-100 font-medium" : ""
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}