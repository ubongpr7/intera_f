"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-2 bg-white border border-gray-300 rounded-md shadow-sm",
        className
      )}
      classNames={{
        months: "flex flex-col space-y-2",
        month: "space-y-2",
        caption: "flex justify-between items-center px-2 py-1 bg-gray-100 border-b border-gray-200",
        caption_label: "text-sm font-medium text-gray-800",
        nav: "flex items-center space-x-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-6 w-6 p-0 text-gray-600 hover:bg-gray-200 rounded-full"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-gray-500 w-8 h-8 flex items-center justify-center text-xs font-medium",
        row: "flex w-full",
        cell: "h-8 w-8 text-center text-sm p-0 relative focus-within:z-100",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 text-sm text-gray-800 hover:bg-gray-200 rounded-full"
        ),
        day_selected: "bg-blue-600 text-white hover:bg-blue-700 rounded-full",
        day_today: "border border-blue-500 text-blue-600 font-semibold",
        day_outside: "text-gray-400",
        day_disabled: "text-gray-300 opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }