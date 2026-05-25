'use client'
import { useState } from 'react';
import { X } from 'lucide-react';
import { useOverlayDismiss } from './useOverlayDismiss';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface VerticalTabsProps {
  items: TabItem[];
  defaultActive?: string;
  className?: string;
  onClose: () => void;
}

const VerticalTabs = ({ items, defaultActive, className, onClose }: VerticalTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultActive || items[0]?.id || '');
  useOverlayDismiss({ onClose });

  const resolvedActiveTab = items.some((tab) => tab.id === activeTab)
    ? activeTab
    : defaultActive || items[0]?.id || '';

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`flex max-h-[90vh] w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-r border-gray-200 bg-gray-50">
          <div className="flex flex-col space-y-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {items.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-all rounded-lg mr-2 ${
                  resolvedActiveTab === tab.id
                    ? 'text-blue-600 bg-white shadow-sm ring-1 ring-gray-200 ring-opacity-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                role="tab"
                aria-selected={resolvedActiveTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 relative">
            <h3 className="text-lg font-semibold text-gray-900">
              {items.find((t) => t.id === resolvedActiveTab)?.label}
            </h3>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600 hover:text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {items.map((tab) => (
              <div
                key={tab.id}
                className={`transition-opacity duration-200 ${
                  resolvedActiveTab === tab.id ? 'opacity-100 block' : 'opacity-0 hidden'
                }`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
              >
                {tab.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerticalTabs;
