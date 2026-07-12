"use client"

import Link from "next/link"
import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type CollapsibleSetupGuideStep = {
  id: string
  title: string
  description: string
  complete: boolean
  icon: LucideIcon
}

export type CollapsibleSetupGuideNote = {
  title: string
  description: string
}

type CollapsibleSetupGuideProps = {
  eyebrow: string
  title: string
  description: string
  steps: readonly CollapsibleSetupGuideStep[]
  nextStep?: {
    href: string
    label: string
  } | null
  completeMessage?: string
  notes?: CollapsibleSetupGuideNote[]
  className?: string
}

export default function CollapsibleSetupGuide({
  eyebrow,
  title,
  description,
  steps,
  nextStep,
  completeMessage,
  notes = [],
  className,
}: CollapsibleSetupGuideProps) {
  const [open, setOpen] = useState(false)
  const hasSteps = steps.length > 0
  const nextIncompleteStep = steps.find((step) => !step.complete) ?? null
  const activeStep = nextStep ? nextIncompleteStep : null

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="gap-2 rounded-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={`setup-guide-${eyebrow.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {open ? "Hide setup guide" : "Show setup guide"}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-5 text-left text-inherit">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {eyebrow}
          </div>
          <CardTitle className="mt-3 text-xl">{title}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-gray-600">{description}</CardDescription>
        </CardHeader>

        {open ? (
          <CardContent id={`setup-guide-${eyebrow.toLowerCase().replace(/\s+/g, "-")}`} className="space-y-4 p-5 pt-0">
            {nextStep ? (
              <Button asChild className="w-full justify-between sm:w-auto">
                <Link href={nextStep.href}>
                  {nextStep.label}
                  <ChevronUp className="h-4 w-4 rotate-90" />
                </Link>
              </Button>
            ) : completeMessage ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{completeMessage}</div>
            ) : null}

            {hasSteps ? (
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isActive = nextStep?.href === `#${step.id}` || (activeStep?.id ?? null) === step.id
                  return (
                    <a
                      key={step.id}
                      href={`#${step.id}`}
                      className={cn(
                        "block rounded-2xl border p-4 transition-colors",
                        step.complete
                          ? "border-green-200 bg-green-50"
                          : isActive
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 rounded-xl p-2",
                            step.complete ? "bg-green-100 text-green-700" : isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600",
                          )}
                        >
                          {step.complete ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Step {index + 1}: {step.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : null}

            {notes.length ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.title} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="font-medium text-gray-900">{note.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{note.description}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        ) : (
          <CardContent className="p-5 pt-0">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              {nextStep ? (
                <span>
                  Next recommended action: <span className="font-semibold text-gray-900">{nextStep.label}</span>
                </span>
              ) : completeMessage ? (
                <span>{completeMessage}</span>
              ) : (
                <span>Open this guide when you need the step-by-step setup sequence.</span>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </section>
  )
}
