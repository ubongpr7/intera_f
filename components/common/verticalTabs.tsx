'use client'
import { useState } from 'react';
import { X } from 'lucide-react';
import { useOverlayDismiss } from './useOverlayDismiss';
import { Button } from '@/components/ui/button';

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
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-6">
      <div
        className={`flex max-h-[min(92vh,900px)] w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-700/80 bg-[#070d1f] text-slate-100 shadow-[0_32px_100px_rgba(0,0,0,0.55)] ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-44 shrink-0 border-r border-slate-800 bg-slate-950/70 sm:w-56">
          <div className="flex flex-col gap-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {items.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={resolvedActiveTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="w-full justify-start text-left"
                role="tab"
                aria-selected={resolvedActiveTab === tab.id}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
            <h3 className="text-lg font-semibold text-slate-50">
              {items.find((t) => t.id === resolvedActiveTab)?.label}
            </h3>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
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
