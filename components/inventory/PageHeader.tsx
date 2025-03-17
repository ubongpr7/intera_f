'use client'
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/buttons/button';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onClose: () => void;

}

export function PageHeader({ title, searchPlaceholder = "Search...", onSearch,onClose }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex flex-wrap items-center justify-between px-4 py-1 md:px-6 md:py-2">
        <h1 className="text-lg md:text-xl font-semibold">{title}</h1>

        <div className="flex items-center gap-2 flex-1 max-w-md mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1 text-sm border bg-gray-50 focus:border-blue-500 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>

        <div className="flex  items-center mt-2 gap-4 ">
          <Button variant="outline" size="sm">Filter</Button>
          <Button variant="outline" size="sm">Sort</Button>
            <Button onClick={()=>{onClose()}} size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New {title}</span>
            </Button>
        </div>
      </div>
    </header>
  );
}
