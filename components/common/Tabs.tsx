'use client'
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?:LucideIcon
}

interface TabsProps {
  items: TabItem[];
  defaultActive?: string;
  className?: string;
}

const Tabs = ({ items, defaultActive, className }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultActive || items[0]?.id || '');

  return (
    <div className={`app-tabs flex flex-col ${className}`}>
      {/* Scrollable Tab Header */}
      <div className="relative border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {items.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_10px_24px_-15px_rgba(37,99,235,.9)]'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
              {tab?.icon &&(
                <tab.icon className='h-4 w-4'/>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="mt-4">
        {items.map((tab) => (
          <div
            key={tab.id}
            className={`transition-opacity duration-200 ${
              activeTab === tab.id ? 'opacity-100 block' : 'opacity-0 hidden'
            }`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
