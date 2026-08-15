"use client"

import type { ReactNode } from "react"
import { CheckCircle2, CircleDashed } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SetupFact = {
  label: string
  value: string | number
}

type OperationalStepSectionProps = {
  id: string
  step: number
  title: string
  description: string
  helper?: string
  status: "complete" | "in_progress" | "pending"
  facts?: SetupFact[]
  notice?: ReactNode
  children: ReactNode
}

const statusLabel: Record<OperationalStepSectionProps["status"], string> = {
  complete: "Ready",
  in_progress: "Recommended next",
  pending: "Pending",
}

export default function OperationalStepSection({
  id,
  step,
  title,
  description,
  helper,
  status,
  facts = [],
  notice,
  children,
}: OperationalStepSectionProps) {
  const isComplete = status === "complete"
  const isNext = status === "in_progress"

  return (
    <Card
      id={id}
      className={cn(
        "scroll-mt-28 border-gray-200 shadow-sm",
        isComplete ? "border-green-200" : isNext ? "border-blue-200" : "border-gray-200",
      )}
    >
      <CardHeader className="gap-4 border-b border-gray-100 p-6 text-left text-inherit">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                  isComplete
                    ? "border-green-200 bg-green-50 text-green-700"
                    : isNext
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-600",
                )}
              >
                Step {step}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                  isComplete
                    ? "border-green-200 bg-green-50 text-green-700"
                    : isNext
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-600",
                )}
              >
                {isComplete ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <CircleDashed className="mr-1 h-3.5 w-3.5" />}
                {statusLabel[status]}
              </Badge>
            </div>
            <div>
              <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{description}</CardDescription>
            </div>
          </div>

          {helper ? (
            <div className="max-w-sm rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {helper}
            </div>
          ) : null}
        </div>

        {facts.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{fact.label}</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{fact.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {notice ? <div>{notice}</div> : null}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  )
}
