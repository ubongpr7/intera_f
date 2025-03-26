'use client'
import { ActionItem } from '../interfaces/common'
import { LucideIcon } from 'lucide-react'
import { useState } from 'react'


interface ActionHeaderProps {
  items: ActionItem[]
  className?: string
}

const ActionHeader = ({ items, className }: ActionHeaderProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className={`overflow-x-auto hide-scrollbar ${className}`}>
      <div className="flex gap-4 pb-2 min-w-max">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={index}
              className="relative flex-shrink-0"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <button
                onClick={() => !item.disabled && item.action()}
                disabled={item.disabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.text}</span>
              </button>

              {/* Mobile tooltip - Now positioned below */}
              {!item.disabled && (
                <div
                  className={`md:hidden absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded transition-opacity duration-200 ${
                    hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ zIndex: 50 }}
                >
                  {item.helpText}
                  {/* Tooltip arrow pointing upward */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ActionHeader