"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatTileProps {
  label: string
  value: string | number
  description: string
  icon: LucideIcon
  tone?: "default" | "amber" | "blue" | "green"
}

const toneStyles: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "bg-gray-50 text-gray-900 border-gray-200",
  amber: "bg-amber-50 text-amber-950 border-amber-200",
  blue: "bg-blue-50 text-blue-950 border-blue-200",
  green: "bg-emerald-50 text-emerald-950 border-emerald-200",
}

export default function StatTile({
  label,
  value,
  description,
  icon: Icon,
  tone = "default",
}: StatTileProps) {
  return (
    <Card className={cn("dashboard-stat-tile overflow-hidden shadow-sm", toneStyles[tone])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">{label}</p>
          <Icon className="h-4 w-4 opacity-70" />
        </div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-2 text-sm opacity-80">{description}</p>
      </CardContent>
    </Card>
  )
}
