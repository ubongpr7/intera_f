import type React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DashboardCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  className?: string
  isLoading?: boolean
}

export function DashboardCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  isLoading = false,
}: DashboardCardProps) {
  return (
    <Card className={cn("p-6 transition-all duration-300 hover:shadow-md", className)}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 bg-gray-100 rounded-full transition-colors hover:bg-gray-200">{icon}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{title} statistics</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-32" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold mb-1">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </>
      )}

      {trend && !isLoading && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "text-xs font-medium mr-2 px-2 py-0.5 rounded cursor-help",
                      trend.isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                    )}
                  >
                    {trend.value.toFixed(1)}%
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {trend.isPositive ? "Positive" : "Negative"} trend for {trend.label}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-gray-500">{trend.label}</p>
          </div>
        </div>
      )}

      {trend && isLoading && (
        <div className="mt-4 pt-4 border-t">
          <Skeleton className="h-4 w-24" />
        </div>
      )}
    </Card>
  )
}
