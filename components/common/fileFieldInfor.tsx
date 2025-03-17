import React from 'react';

interface FieldInfoProps {
  info: string;
  displayBelow?: boolean; // Optional prop, default is false
}

export function FieldInfo({ info, displayBelow = false }: FieldInfoProps) {
  return (
    <div className="relative ml-2 inline-block group">
      {/* Info Icon */}
      <span className="text-sm text-gray-400 cursor-help hover:text-gray-500">ⓘ</span>

      {/* Tooltip */}
      <div
        className={`absolute hidden p-2 text-xs text-white bg-gray-700 rounded-lg shadow-lg group-hover:block min-w-[200px] z-50 ${
          displayBelow
            ? 'top-full mt-2' // Display below the icon
            : 'bottom-full mb-2' // Display above the icon (default)
        } left-1/2 -translate-x-1/2`}
      >
        {info}
        
        {/* Tooltip Arrow */}
        <div
          className={`absolute ${
            displayBelow
              ? 'bottom-full border-t-transparent border-b-gray-700' // Arrow points up
              : 'top-full border-b-transparent border-t-gray-700' // Arrow points down (default)
          } left-1/2 -translate-x-1/2 border-8`}
        ></div>
      </div>
    </div>
  );
}