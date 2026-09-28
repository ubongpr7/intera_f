'use client'
import type { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { useUrlTabState } from '@/hooks/useUrlTabState'

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  icon?: LucideIcon
}

interface TabsProps {
  items: TabItem[]
  defaultActive?: string
  className?: string
  children?: (activeTab: string) => ReactNode
}

const Tabs = ({ items, defaultActive, className, children }: TabsProps) => {
  const { activeValue: activeTab, setActiveValue: setActiveTab } =
    useUrlTabState({
      defaultValue: defaultActive || items[0]?.id || '',
      values: items.map((item) => item.id)
    })

  return (
    <div className={`app-tabs flex flex-col ${className}`}>
      {/* Scrollable Tab Header */}
      <div className="relative border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {items.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_10px_24px_-15px_rgba(37,99,235,.9)]'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
            >
              {tab.label}
              {tab?.icon && <tab.icon className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="mt-4">
        {children
          ? children(activeTab)
          : items.map((tab) => (
              <div
                key={tab.id}
                className={`transition-opacity duration-200 ${
                  activeTab === tab.id
                    ? 'opacity-100 block'
                    : 'opacity-0 hidden'
                }`}
                role="tabpanel"
                id={`tabpanel-${tab.id}`}
                aria-labelledby={`tab-${tab.id}`}
              >
                {tab.content}
              </div>
            ))}
      </div>
    </div>
  )
}

export default Tabs
