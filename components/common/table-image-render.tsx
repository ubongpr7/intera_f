"use client"

import { useState } from "react"

interface TableImageHoverProps {
  src: string
  alt: string
  className?: string
}

export function TableImageHover({ src, alt, className = "" }: TableImageHoverProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative inline-block">
      <img
        src={src || "/placeholder.png"}
        alt={alt}
        className={`w-10 h-10 object-cover rounded cursor-pointer transition-all duration-200 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Popup Image */}
      {isHovered && (
        <div className="absolute z-50 pointer-events-none">
          {/* Position the popup above and to the right of the original image */}
          <div className="absolute -top-32 -left-16 transform">
            <div className="bg-white border border-gray-200 rounded-lg  p-2">
              <img src={src || "/placeholder.png"} alt={alt} className="w-full h-80  object-contain rounded" />
            </div>
            {/* Arrow pointing down to the original image */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
