import React from 'react';
import { Info } from 'lucide-react';

interface FieldInfoProps {
  info: string;
  displayBelow?: boolean; // Optional prop, default is false
}

export function FieldInfo({ info, displayBelow = false }: FieldInfoProps) {
  return (
    <div className="relative z-10 ml-2 inline-block group hover:z-[140] focus-within:z-[140]">
      <span className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-slate-300/80 bg-white/80 text-slate-500 shadow-sm transition group-hover:border-blue-400 group-hover:text-blue-600 dark:border-slate-600 dark:bg-slate-900/85 dark:text-slate-300 dark:group-hover:border-blue-400 dark:group-hover:text-blue-300">
        <Info className="h-3.5 w-3.5" />
      </span>

      <div
        className={`absolute z-[150] hidden max-w-xs min-w-[220px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs leading-5 text-slate-700 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur group-hover:block group-focus-within:block dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-200 ${
          displayBelow
            ? 'top-full mt-2'
            : 'bottom-full mb-2'
        } left-1/2 -translate-x-1/2`}
      >
        {info}
        <div
          className={`absolute ${
            displayBelow
              ? 'bottom-full border-b-white/95 border-l-transparent border-r-transparent border-t-transparent dark:border-b-slate-950/95'
              : 'top-full border-t-white/95 border-b-transparent border-l-transparent border-r-transparent dark:border-t-slate-950/95'
          } left-1/2 -translate-x-1/2 border-[7px]`}
        ></div>
      </div>
    </div>
  );
}
