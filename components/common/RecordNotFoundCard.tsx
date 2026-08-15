"use client"

import { Inbox } from "lucide-react"

type RecordNotFoundCardProps = {
  title: string
  description?: string
}

export function RecordNotFoundCard({ title, description = "The record may have been deleted, archived, or you may not have access to it." }: RecordNotFoundCardProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-border bg-muted/35 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
