"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type InventoryAttentionItem = {
  id: string
  title: string
  imageUrl?: string | null
  supporting?: string | null
  detail?: string | null
  href?: string
  badge?: string | number | null
}

type InventoryAttentionCardProps = {
  title: string
  description: string
  emptyMessage: string
  items: InventoryAttentionItem[]
}

export default function InventoryAttentionCard({
  title,
  description,
  emptyMessage,
  items,
}: InventoryAttentionCardProps) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-5 text-left text-inherit">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">{emptyMessage}</div>
        ) : (
          items.map((item) => {
            const body = (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:border-gray-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Inv
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                      {item.supporting ? <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{item.supporting}</p> : null}
                      {item.detail ? <p className="mt-2 text-sm leading-5 text-gray-600">{item.detail}</p> : null}
                    </div>
                  </div>
                  {item.badge !== undefined && item.badge !== null ? (
                    <div className="shrink-0 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                      {item.badge}
                    </div>
                  ) : null}
                </div>
              </div>
            )

            if (!item.href) {
              return <div key={item.id}>{body}</div>
            }

            return (
              <Link key={item.id} href={item.href} className="block">
                <div className="group relative">
                  {body}
                  <ArrowRight className="absolute right-4 top-4 h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
