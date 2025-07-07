"use client"

import { useState } from "react"

interface TableImageHoverProps {
  src: string
  alt: string
  productName?: string
  className?: string
}

export function TableImageHover({ src, alt, productName, className = "" }: TableImageHoverProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative inline-block">
      {/* Original small image */}
      <img
        src={src || "/placeholder.png"}
        alt={alt}
        className={`w-10 h-10 object-cover rounded border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 cursor-pointer ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Large popup image - positioned absolutely outside table constraints */}
      {isHovered && (
        <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
          <div className="bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 animate-in fade-in zoom-in duration-200">
            <img
              src={src || "/placeholder.png"}
              alt={alt}
              className="w-80 h-80 object-contain rounded max-w-[80vw] max-h-[70vh]"
            />
            {productName && (
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-gray-700 truncate max-w-80">{productName}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
