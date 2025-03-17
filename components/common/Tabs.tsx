'use client'
import { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultActive?: string;
  className?: string;
}

const Tabs = ({ items, defaultActive, className }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultActive || items[0]?.id || '');

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Scrollable Tab Header */}
      <div className="relative border-b border-gray-200 ">
        <div className="flex space-x-4 overflow-x-auto pb-px hide-scrollbar">
          {items.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 '
                    : 'text-gray-500 hover:text-gray-700 '
                }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
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