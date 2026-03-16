"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Fact = {
  label: string
  value: string | number
}

interface DomainLaunchCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  facts: Fact[]
  ctaLabel?: string
}

export default function DomainLaunchCard({
  title,
  description,
  href,
  icon: Icon,
  facts,
  ctaLabel = "Open workspace",
}: DomainLaunchCardProps) {
  return (
    <Card className="border-gray-200 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <CardTitle className="mt-3 text-xl tracking-tight">{title}</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{fact.label}</div>
              <div className="mt-2 text-base font-semibold text-gray-900">{fact.value}</div>
            </div>
          ))}
        </div>

        <Button asChild className="w-full justify-between">
          <Link href={href}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
